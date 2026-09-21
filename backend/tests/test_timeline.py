import unittest

from services.timeline import TimelineSimulator


ALGORITHMS = [
    "round_robin",
    "least_load",
    "weighted_round_robin",
    "priority_based",
    "genetic_algorithm"
]


class TestTimelineSimulator(unittest.TestCase):

    def setUp(self):
        self.simulator = TimelineSimulator()

    def _run(self, algorithm, **overrides):
        options = {
            "algorithm": algorithm,
            "number_of_requests": 120,
            "number_of_servers": 5,
            "server_type": "heterogeneous",
            "workload_type": "medium",
            "arrival_rate": 20
        }

        options.update(overrides)

        return self.simulator.run(**options)

    def test_every_algorithm_runs(self):
        for algorithm in ALGORITHMS:
            with self.subTest(algorithm=algorithm):
                result = self._run(algorithm)

                self.assertEqual(result["mode"], "timeline")
                self.assertEqual(result["algorithm"], algorithm)
                self.assertEqual(len(result["requests"]), 120)

    def test_accepted_requests_have_a_complete_record(self):
        for algorithm in ALGORITHMS:
            with self.subTest(algorithm=algorithm):
                result = self._run(algorithm)

                for record in result["requests"]:

                    if record["status"] != "accepted":
                        self.assertIsNone(record["server"])
                        self.assertIsNone(record["start"])
                        continue

                    self.assertIsNotNone(record["server"])

                    # A request cannot start before it arrives, and cannot
                    # finish before it starts.
                    self.assertGreaterEqual(
                        record["start"] + 1e-6,
                        record["arrival"]
                    )

                    self.assertGreaterEqual(
                        record["end"] + 1e-6,
                        record["start"]
                    )

    def test_service_time_matches_workload_over_power(self):
        result = self._run("least_load")

        power = {
            server["server_id"]: server["processing_power"]
            for server in result["servers"]
        }

        for record in result["requests"]:

            if record["status"] != "accepted":
                continue

            expected = record["workload"] / power[record["server"]]
            actual = record["end"] - record["start"]

            self.assertAlmostEqual(expected, actual, places=3)

    def test_a_server_never_serves_two_requests_at_once(self):
        result = self._run("round_robin")

        by_server = {}

        for record in result["requests"]:

            if record["status"] != "accepted":
                continue

            by_server.setdefault(record["server"], []).append(
                (record["start"], record["end"])
            )

        for server_id, spans in by_server.items():
            spans.sort()

            for index in range(1, len(spans)):
                # The next request starts only once the previous one ends.
                self.assertGreaterEqual(
                    spans[index][0] + 1e-6,
                    spans[index - 1][1],
                    f"overlapping service on server {server_id}"
                )

    def test_capacity_is_never_exceeded(self):
        result = self._run("least_load", arrival_rate=0)

        capacity = {
            server["server_id"]: server["capacity"]
            for server in result["servers"]
        }

        # Rebuild in-flight load from the event boundaries.
        events = []

        for record in result["requests"]:

            if record["status"] != "accepted":
                continue

            events.append((record["arrival"], record["workload"], record["server"]))
            events.append((record["end"], -record["workload"], record["server"]))

        events.sort(key=lambda event: (event[0], event[1]))

        load = {server_id: 0 for server_id in capacity}

        for _, delta, server_id in events:
            load[server_id] += delta

            self.assertLessEqual(
                load[server_id],
                capacity[server_id],
                f"server {server_id} exceeded capacity"
            )

    def test_summary_counts_add_up(self):
        result = self._run("weighted_round_robin")

        summary = result["summary"]

        self.assertEqual(
            summary["requests_accepted"] + summary["requests_rejected"],
            summary["requests_sent"]
        )

        accepted = sum(
            1
            for record in result["requests"]
            if record["status"] == "accepted"
        )

        self.assertEqual(accepted, summary["requests_accepted"])

    def test_burst_arrivals_all_start_at_zero(self):
        result = self._run("least_load", arrival_rate=0)

        for record in result["requests"]:
            self.assertEqual(record["arrival"], 0.0)

    def test_samples_cover_the_run(self):
        result = self._run("least_load")

        samples = result["samples"]

        self.assertTrue(samples)
        self.assertEqual(samples[0]["t"], 0.0)

        self.assertAlmostEqual(
            samples[-1]["t"],
            result["duration"],
            places=2
        )

        # Completed counts are cumulative, so they never go down.
        for index in range(1, len(samples)):
            for column, value in enumerate(samples[index]["completed"]):
                self.assertGreaterEqual(
                    value,
                    samples[index - 1]["completed"][column]
                )

    def test_rejected_requests_appear_when_the_pool_is_swamped(self):
        result = self._run(
            "least_load",
            number_of_requests=4000,
            number_of_servers=2,
            workload_type="heavy",
            arrival_rate=0
        )

        self.assertGreater(result["summary"]["requests_rejected"], 0)

    def test_sampled_load_never_exceeds_capacity(self):
        """
        The samples are what the UI draws. Earlier they counted every request
        overlapping a window, which let a finishing and a starting request be
        counted together and rendered a tank above 100%.
        """

        for algorithm in ALGORITHMS:
            with self.subTest(algorithm=algorithm):
                result = self._run(
                    algorithm,
                    number_of_requests=900,
                    number_of_servers=6,
                    workload_type="heavy",
                    arrival_rate=6
                )

                capacities = [
                    server["capacity"]
                    for server in result["servers"]
                ]

                for sample in result["samples"]:
                    for column, load in enumerate(sample["load"]):
                        self.assertLessEqual(
                            load,
                            capacities[column],
                            f"sample at t={sample['t']} exceeds capacity"
                        )

    def test_a_sample_never_shows_two_requests_on_one_cpu(self):
        result = self._run("round_robin", arrival_rate=6)

        for sample in result["samples"]:
            for count in sample["in_service"]:
                self.assertLessEqual(count, 1)

    def test_invalid_algorithm_is_rejected(self):
        with self.assertRaises(ValueError):
            self._run("nope")


if __name__ == "__main__":
    unittest.main()
