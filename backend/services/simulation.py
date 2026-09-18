from copy import deepcopy

from services.generator import SimulationGenerator

from algorithms.round_robin import RoundRobin
from algorithms.least_load import LeastLoad
from algorithms.weighted_round_robin import WeightedRoundRobin
from algorithms.priority_based import PriorityBased
from algorithms.genetic_algorithm import GeneticAlgorithm


class SimulationService:

    def __init__(self):
        self.generator = SimulationGenerator()

    def run_simulation(
        self,
        algorithm,
        number_of_requests,
        number_of_servers,
        server_type,
        workload_type
    ):
        # Generate one common scenario.
        # The same scenario is used by every algorithm
        # in comparison mode.
        servers = self.generator.generate_servers(
            number_of_servers,
            server_type
        )

        requests = self.generator.generate_requests(
            number_of_requests,
            workload_type
        )

        algorithm = algorithm.lower()

        # Compare all algorithms
        if algorithm == "all":
            return self._run_all_algorithms(
                servers,
                requests,
                workload_type
            )

        # Run one selected algorithm
        algorithm_instance = self._get_algorithm(
            algorithm
        )

        algorithm_instance.run(
            servers,
            requests
        )

        return self._build_result(
            algorithm,
            servers,
            requests,
            workload_type
        )

    def _run_all_algorithms(
        self,
        servers,
        requests,
        workload_type
    ):

        algorithms = [
            "round_robin",
            "least_load",
            "weighted_round_robin",
            "priority_based",
            "genetic_algorithm"
        ]

        results = {}
        initial_servers = []

        for server in servers:

            initial_servers.append({
                "server_id": server.server_id,
                "capacity": server.capacity,
                "processing_power": server.processing_power,
                "initial_load": server.current_load
            })

        for algorithm_name in algorithms:

            # Every algorithm gets its own independent copy.
            algorithm_servers = deepcopy(servers)
            algorithm_requests = deepcopy(requests)

            algorithm_instance = self._get_algorithm(
                algorithm_name
            )

            algorithm_instance.run(
                algorithm_servers,
                algorithm_requests
            )

            results[algorithm_name] = self._build_result(
                algorithm_name,
                algorithm_servers,
                algorithm_requests,
                workload_type
            )

        return {
            "mode": "comparison",
            "number_of_servers": len(servers),
            "number_of_requests": len(requests),
            "workload_type": workload_type,
            "initial_servers": initial_servers,
            "results": results
        }

    def _get_algorithm(self, algorithm):

        algorithms = {
            "round_robin": RoundRobin,
            "least_load": LeastLoad,
            "weighted_round_robin": WeightedRoundRobin,
            "priority_based": PriorityBased,
            "genetic_algorithm": GeneticAlgorithm
        }

        if algorithm not in algorithms:
            raise ValueError(
                "Invalid algorithm selected."
            )

        return algorithms[algorithm]()

    def _build_result(
        self,
        algorithm,
        servers,
        requests,
        workload_type
    ):

        server_results = []

        for server in servers:

            server_results.append({
                "server_id": server.server_id,
                "capacity": server.capacity,
                "processing_power": server.processing_power,
                "current_load": server.current_load,
                "load_percentage": round(
                    server.get_load_percentage(),
                    2
                ),
                "assigned_requests": [
                    request.request_id
                    for request in server.assigned_requests
                ]
            })

        request_results = []

        accepted_requests = 0
        rejected_requests = 0

        for request in requests:

            assigned_server = (
                request.assigned_server.server_id
                if request.assigned_server
                else None
            )

            if assigned_server is not None:
                accepted_requests += 1
            else:
                rejected_requests += 1

            request_results.append({
                "request_id": request.request_id,
                "workload": request.workload,
                "priority": request.priority,
                "assigned_server": assigned_server,
                "status": (
                    "accepted"
                    if assigned_server is not None
                    else "rejected"
                )
            })

        return {
            "algorithm": algorithm,
            "number_of_servers": len(servers),
            "number_of_requests": len(requests),
            "workload_type": workload_type,

            "requests_sent": len(requests),
            "requests_accepted": accepted_requests,
            "requests_rejected": rejected_requests,

            "acceptance_rate": round(
                (
                    accepted_requests / len(requests) * 100
                )
                if requests
                else 0,
                2
            ),

            "rejection_rate": round(
                (
                    rejected_requests / len(requests) * 100
                )
                if requests
                else 0,
                2
            ),

            "servers": server_results,
            "requests": request_results
        }