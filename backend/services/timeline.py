import heapq
import math

from copy import deepcopy

from services.generator import SimulationGenerator

from algorithms.genetic_algorithm import GeneticAlgorithm


class TimelineSimulator:
    """
    Discrete-event simulation of the load balancer.

    This is deliberately separate from SimulationService. That service answers
    "given all requests at once, where do they end up?" and never frees
    capacity. This one answers "as requests arrive over time and servers work
    through them, what happens?" — so a completed request RELEASES its
    workload and the server can accept more.

    That makes capacity a concurrency limit here (queued + in service), rather
    than a lifetime total. The two endpoints therefore report different
    acceptance rates on purpose; neither is wrong, they answer different
    questions.

    Service model matches services/metrics.py: a server works through its
    queue one request at a time, and a request of size w occupies a server of
    power p for w / p time units.
    """

    # Event kinds, ordered so that completions at the same timestamp free
    # capacity before a new arrival tests it.
    COMPLETION = 0
    ARRIVAL = 1

    def __init__(self):
        self.generator = SimulationGenerator()

    def run(
        self,
        algorithm,
        number_of_requests,
        number_of_servers,
        server_type,
        workload_type,
        arrival_rate=0,
        sample_count=240
    ):
        servers = self.generator.generate_servers(
            number_of_servers,
            server_type
        )

        requests = self.generator.generate_requests(
            number_of_requests,
            workload_type
        )

        algorithm = algorithm.lower()

        dispatcher = self._get_dispatcher(
            algorithm,
            servers,
            requests
        )

        records = self._simulate(
            servers,
            requests,
            dispatcher,
            arrival_rate,
            use_priority_queue=(algorithm == "priority_based")
        )

        duration = max(
            (
                record["end"]
                for record in records
                if record["end"] is not None
            ),
            default=0.0
        )

        return {
            "mode": "timeline",

            "algorithm": algorithm,

            "configuration": {
                "number_of_servers": number_of_servers,
                "number_of_requests": number_of_requests,
                "server_type": server_type,
                "workload_type": workload_type,
                "arrival_rate": arrival_rate
            },

            "servers": [
                {
                    "server_id": server.server_id,
                    "capacity": server.capacity,
                    "processing_power": server.processing_power
                }
                for server in servers
            ],

            "requests": records,

            "duration": round(duration, 4),

            # The saturation point: how many requests per second this pool can
            # sustain. Arrival rates above it build queues and then rejections.
            "system": self._build_system(servers, requests),

            "summary": self._build_summary(records),

            "metrics": self._build_metrics(
                servers,
                records,
                duration
            ),

            "samples": self._build_samples(
                servers,
                records,
                duration,
                sample_count
            )
        }

    # ------------------------------------------------------------------
    # Dispatchers — the online equivalent of backend/algorithms/*.py
    # ------------------------------------------------------------------

    def _get_dispatcher(self, algorithm, servers, requests):

        if algorithm == "round_robin":
            return RoundRobinDispatcher(servers)

        if algorithm == "least_load":
            return LeastLoadDispatcher(servers)

        if algorithm == "weighted_round_robin":
            return WeightedRoundRobinDispatcher(servers)

        if algorithm == "priority_based":
            # Online arrivals cannot be globally sorted by priority, so the
            # priority rule is applied where it still makes sense: placement
            # is least-load, and each server SERVES its queue highest
            # priority first (see use_priority_queue).
            return LeastLoadDispatcher(servers)

        if algorithm == "genetic_algorithm":
            # The GA optimises the whole request set at once, so it has no
            # online form. Its batch solution is computed up front and then
            # replayed as requests arrive.
            return PrecomputedDispatcher(
                servers,
                self._precompute_genetic(servers, requests)
            )

        raise ValueError("Invalid algorithm selected.")

    def _precompute_genetic(self, servers, requests):

        plan_servers = deepcopy(servers)
        plan_requests = deepcopy(requests)

        GeneticAlgorithm().run(plan_servers, plan_requests)

        plan = {}

        for request in plan_requests:

            plan[request.request_id] = (
                request.assigned_server.server_id
                if request.assigned_server
                else None
            )

        return plan

    # ------------------------------------------------------------------
    # The event loop
    # ------------------------------------------------------------------

    def _simulate(
        self,
        servers,
        requests,
        dispatcher,
        arrival_rate,
        use_priority_queue
    ):
        state = {
            server.server_id: {
                "server": server,
                "load": 0,
                "queue": [],
                "busy": False
            }
            for server in servers
        }

        records = {}
        events = []

        # arrival_rate of 0 means a burst: everything shows up at t = 0.
        interval = (
            1.0 / arrival_rate
            if arrival_rate and arrival_rate > 0
            else 0.0
        )

        for index, request in enumerate(requests):

            arrival = index * interval

            records[request.request_id] = {
                "request_id": request.request_id,
                "workload": request.workload,
                "priority": request.priority,
                "arrival": round(arrival, 4),
                "server": None,
                "start": None,
                "end": None,
                "status": "rejected"
            }

            heapq.heappush(
                events,
                (arrival, self.ARRIVAL, index, request)
            )

        sequence = len(requests)

        while events:

            time, kind, order, payload = heapq.heappop(events)

            if kind == self.COMPLETION:

                server_id, request = payload

                entry = state[server_id]
                entry["load"] -= request.workload
                entry["busy"] = False

                self._start_next(
                    entry,
                    time,
                    events,
                    records,
                    use_priority_queue
                )

                continue

            # Arrival
            request = payload

            server = dispatcher.select(request, state)

            if server is None:
                # Every server is at capacity, so the request is dropped.
                continue

            entry = state[server.server_id]
            entry["load"] += request.workload

            record = records[request.request_id]
            record["server"] = server.server_id
            record["status"] = "accepted"

            sequence += 1

            heapq.heappush(
                entry["queue"],
                (
                    -request.priority if use_priority_queue else 0,
                    sequence,
                    request
                )
            )

            if not entry["busy"]:
                self._start_next(
                    entry,
                    time,
                    events,
                    records,
                    use_priority_queue
                )

        return [
            records[key]
            for key in sorted(records)
        ]

    def _start_next(
        self,
        entry,
        time,
        events,
        records,
        use_priority_queue
    ):
        if entry["busy"] or not entry["queue"]:
            return

        _, order, request = heapq.heappop(entry["queue"])

        server = entry["server"]

        service_time = (
            request.workload / server.processing_power
            if server.processing_power > 0
            else 0.0
        )

        end = time + service_time

        record = records[request.request_id]
        record["start"] = round(time, 4)
        record["end"] = round(end, 4)

        entry["busy"] = True

        heapq.heappush(
            events,
            (
                end,
                self.COMPLETION,
                order,
                (server.server_id, request)
            )
        )

    # ------------------------------------------------------------------
    # Reporting
    # ------------------------------------------------------------------

    def _build_system(self, servers, requests):

        total_power = sum(
            server.processing_power
            for server in servers
        )

        total_capacity = sum(
            server.capacity
            for server in servers
        )

        mean_workload = (
            sum(request.workload for request in requests)
            / len(requests)
            if requests
            else 0
        )

        # Each server clears processing_power workload units per second, so
        # the pool clears total_power / mean_workload requests per second.
        capacity_rate = (
            total_power / mean_workload
            if mean_workload > 0
            else 0
        )

        return {
            "total_processing_power": round(total_power, 2),

            "total_capacity": total_capacity,

            "mean_workload": round(mean_workload, 2),

            "capacity_rate": round(capacity_rate, 3),

            "per_server_rate": [
                {
                    "server_id": server.server_id,

                    "rate": round(
                        server.processing_power / mean_workload
                        if mean_workload > 0
                        else 0,
                        3
                    )
                }
                for server in servers
            ]
        }

    def _build_summary(self, records):

        accepted = sum(
            1
            for record in records
            if record["status"] == "accepted"
        )

        total = len(records)
        rejected = total - accepted

        return {
            "requests_sent": total,

            "requests_accepted": accepted,

            "requests_rejected": rejected,

            "acceptance_rate": round(
                (accepted / total * 100) if total else 0,
                2
            ),

            "rejection_rate": round(
                (rejected / total * 100) if total else 0,
                2
            )
        }

    def _build_metrics(self, servers, records, duration):

        served = [
            record
            for record in records
            if record["status"] == "accepted"
        ]

        processing_times = [
            record["end"] - record["start"]
            for record in served
        ]

        waiting_times = [
            record["start"] - record["arrival"]
            for record in served
        ]

        response_times = [
            record["end"] - record["arrival"]
            for record in served
        ]

        busy_by_server = {
            server.server_id: 0.0
            for server in servers
        }

        served_by_server = {
            server.server_id: 0
            for server in servers
        }

        for record in served:
            busy_by_server[record["server"]] += (
                record["end"] - record["start"]
            )

            served_by_server[record["server"]] += 1

        # Utilization here is share of TIME busy, not share of capacity.
        utilizations = [
            (busy_by_server[server.server_id] / duration * 100)
            if duration > 0
            else 0
            for server in servers
        ]

        average = (
            sum(utilizations) / len(utilizations)
            if utilizations
            else 0
        )

        return {
            "average_utilization": round(average, 2),

            "maximum_utilization": round(
                max(utilizations) if utilizations else 0,
                2
            ),

            "minimum_utilization": round(
                min(utilizations) if utilizations else 0,
                2
            ),

            "load_imbalance": round(
                (max(utilizations) - min(utilizations))
                if utilizations
                else 0,
                2
            ),

            "servers_used": sum(
                1
                for server in servers
                if served_by_server[server.server_id] > 0
            ),

            "average_processing_time": round(
                sum(processing_times) / len(processing_times)
                if processing_times
                else 0,
                2
            ),

            "average_waiting_time": round(
                sum(waiting_times) / len(waiting_times)
                if waiting_times
                else 0,
                2
            ),

            "average_response_time": round(
                sum(response_times) / len(response_times)
                if response_times
                else 0,
                2
            ),

            "throughput": round(
                len(served) / duration
                if duration > 0
                else 0,
                2
            ),

            "makespan": round(duration, 2)
        }

    def _build_samples(
        self,
        servers,
        records,
        duration,
        sample_count
    ):
        """
        Server state on a fixed time grid, so the frontend can draw the
        animation without replaying every event for each frame.

        These are POINT-IN-TIME snapshots: a request counts towards a sample
        only if it is in the server at that exact instant. Counting every
        request that merely overlaps the surrounding window would double count
        one finishing and another starting inside the same window, and could
        report a load above the server's capacity.
        """

        if duration <= 0 or sample_count <= 0:
            return []

        server_ids = [server.server_id for server in servers]
        index_of = {
            server_id: index
            for index, server_id in enumerate(server_ids)
        }

        step = duration / sample_count

        # Bucket each accepted request into the sample range it occupies.
        in_service = [
            [0] * len(server_ids)
            for _ in range(sample_count + 1)
        ]

        load = [
            [0] * len(server_ids)
            for _ in range(sample_count + 1)
        ]

        completed = [
            [0] * len(server_ids)
            for _ in range(sample_count + 1)
        ]

        rejected = [0] * (sample_count + 1)

        def first_instant_at_or_after(time):
            # Index of the earliest sample instant >= time.
            return max(0, min(sample_count, math.ceil(time / step - 1e-9)))

        def last_instant_before(time):
            # Index of the latest sample instant < time.
            return max(-1, min(sample_count, math.ceil(time / step - 1e-9) - 1))

        for record in records:

            if record["status"] != "accepted":
                rejected[first_instant_at_or_after(record["arrival"])] += 1
                continue

            column = index_of[record["server"]]

            # Holds capacity over [arrival, end).
            for bucket in range(
                first_instant_at_or_after(record["arrival"]),
                last_instant_before(record["end"]) + 1
            ):
                load[bucket][column] += record["workload"]

            # Actually on the CPU over [start, end).
            for bucket in range(
                first_instant_at_or_after(record["start"]),
                last_instant_before(record["end"]) + 1
            ):
                in_service[bucket][column] += 1

            completed[first_instant_at_or_after(record["end"])][column] += 1

        samples = []
        running_completed = [0] * len(server_ids)
        running_rejected = 0

        for bucket in range(sample_count + 1):

            for column in range(len(server_ids)):
                running_completed[column] += completed[bucket][column]

            running_rejected += rejected[bucket]

            samples.append({
                "t": round(bucket * step, 4),

                "load": load[bucket][:],

                "in_service": in_service[bucket][:],

                "completed": running_completed[:],

                "rejected": running_rejected
            })

        return samples


# ----------------------------------------------------------------------
# Dispatchers
# ----------------------------------------------------------------------


def _has_room(entry, request):
    server = entry["server"]
    return entry["load"] + request.workload <= server.capacity


class RoundRobinDispatcher:
    """Sequential, with the same capacity fallback scan as RoundRobin."""

    def __init__(self, servers):
        self.servers = servers
        self.index = 0

    def select(self, request, state):

        count = len(self.servers)

        for offset in range(count):

            server = self.servers[(self.index + offset) % count]

            if _has_room(state[server.server_id], request):
                self.index = (self.index + offset + 1) % count
                return server

        self.index = (self.index + 1) % count
        return None


class LeastLoadDispatcher:
    """Greedy: the server with the smallest in-flight load that still fits."""

    def __init__(self, servers):
        self.servers = servers

    def select(self, request, state):

        available = [
            server
            for server in self.servers
            if _has_room(state[server.server_id], request)
        ]

        if not available:
            return None

        return min(
            available,
            key=lambda server: (
                state[server.server_id]["load"] / server.capacity
                if server.capacity
                else 0
            )
        )


class WeightedRoundRobinDispatcher:
    """Round robin over slots, where stronger servers hold more slots."""

    def __init__(self, servers):
        self.slots = []

        for server in servers:
            weight = max(1, round(server.processing_power))

            for _ in range(weight):
                self.slots.append(server)

        self.index = 0

    def select(self, request, state):

        count = len(self.slots)

        if count == 0:
            return None

        for offset in range(count):

            server = self.slots[(self.index + offset) % count]

            if _has_room(state[server.server_id], request):
                self.index = (self.index + offset + 1) % count
                return server

        self.index = (self.index + 1) % count
        return None


class PrecomputedDispatcher:
    """Replays a batch solution (used by the genetic algorithm)."""

    def __init__(self, servers, plan):
        self.by_id = {
            server.server_id: server
            for server in servers
        }

        self.plan = plan

    def select(self, request, state):

        server_id = self.plan.get(request.request_id)

        if server_id is None:
            return None

        server = self.by_id[server_id]

        if not _has_room(state[server_id], request):
            return None

        return server
