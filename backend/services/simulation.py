from copy import deepcopy

from services.generator import SimulationGenerator
from services.metrics import SimulationMetrics

from algorithms.round_robin import RoundRobin
from algorithms.least_load import LeastLoad
from algorithms.weighted_round_robin import WeightedRoundRobin
from algorithms.priority_based import PriorityBased
from algorithms.genetic_algorithm import GeneticAlgorithm


class SimulationService:

    def __init__(self):
        self.generator = SimulationGenerator()
        self.metrics = SimulationMetrics()

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
                server_type,
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
            server_type,
            workload_type
        )

    def _run_all_algorithms(
        self,
        servers,
        requests,
        server_type,
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

        # Common initial server configuration.
        # This is shared by all algorithms.
        initial_servers = []

        for server in servers:

            initial_servers.append({
                "server_id": server.server_id,
                "capacity": server.capacity,
                "processing_power": server.processing_power
            })

        for algorithm_name in algorithms:

            # Every algorithm receives an independent copy
            # of the exact same scenario.
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
                server_type,
                workload_type
            )

        return {
            "mode": "comparison",

            "configuration": {
                "number_of_servers": len(servers),
                "number_of_requests": len(requests),
                "server_type": server_type,
                "workload_type": workload_type
            },

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
        server_type,
        workload_type
    ):

        server_results = []

        for server in servers:

            server_results.append({
                "server_id": server.server_id,
                "capacity": server.capacity,
                "processing_power": server.processing_power,

                "initial_load": 0,

                "final_load": server.current_load,

                "utilization": round(
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

        # Calculate additional simulation metrics.
        metrics = self.metrics.calculate_metrics(
            servers,
            requests
        )

        return {
            "algorithm": algorithm,

            "configuration": {
                "number_of_servers": len(servers),
                "number_of_requests": len(requests),
                "server_type": server_type,
                "workload_type": workload_type
            },

            "summary": {
                "requests_sent": len(requests),

                "requests_accepted": accepted_requests,

                "requests_rejected": rejected_requests,

                "acceptance_rate": round(
                    (
                        accepted_requests
                        / len(requests)
                        * 100
                    )
                    if requests
                    else 0,
                    2
                ),

                "rejection_rate": round(
                    (
                        rejected_requests
                        / len(requests)
                        * 100
                    )
                    if requests
                    else 0,
                    2
                )
            },

            "metrics": metrics,

            "algorithm_information":
                self._get_algorithm_information(
                    algorithm
                ),

            "servers": server_results,

            "requests": request_results
        }

    def _get_algorithm_information(self, algorithm):

        information = {

            "round_robin": {
                "approach": "Sequential distribution",
                "priority": False,
                "processing_power": False
            },

            "least_load": {
                "approach": "Greedy load-based distribution",
                "priority": False,
                "processing_power": False
            },

            "weighted_round_robin": {
                "approach": "Weighted sequential distribution",
                "priority": False,
                "processing_power": True
            },

            "priority_based": {
                "approach": "Priority-based greedy distribution",
                "priority": True,
                "processing_power": False
            },

            "genetic_algorithm": {
                "approach": "Genetic optimization",
                "priority": False,
                "processing_power": False
            }
        }

        return information[algorithm]