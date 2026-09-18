class SimulationMetrics:

    def calculate_metrics(self, servers, requests):

        utilizations = [
            server.get_load_percentage()
            for server in servers
        ]

        # Load Balancing Metrics

        average_utilization = (
            sum(utilizations) / len(utilizations)
            if utilizations
            else 0
        )

        maximum_utilization = (
            max(utilizations)
            if utilizations
            else 0
        )

        minimum_utilization = (
            min(utilizations)
            if utilizations
            else 0
        )

        load_imbalance = (
            maximum_utilization - minimum_utilization
            if utilizations
            else 0
        )

        servers_used = sum(
            1
            for server in servers
            if server.assigned_requests
        )

        # Performance Metrics

        processing_times = []
        response_times = []

        for server in servers:

            if server.processing_power <= 0:
                continue

            cumulative_workload = 0

            for request in server.assigned_requests:

                processing_time = (
                    request.workload
                    / server.processing_power
                )

                waiting_time = (
                    cumulative_workload
                    / server.processing_power
                )

                response_time = (
                    waiting_time
                    + processing_time
                )

                processing_times.append(
                    processing_time
                )

                response_times.append(
                    response_time
                )

                cumulative_workload += request.workload

        average_processing_time = (
            sum(processing_times)
            / len(processing_times)
            if processing_times
            else 0
        )

        average_response_time = (
            sum(response_times)
            / len(response_times)
            if response_times
            else 0
        )

        return {
            "average_utilization": round(
                average_utilization,
                2
            ),

            "maximum_utilization": round(
                maximum_utilization,
                2
            ),

            "minimum_utilization": round(
                minimum_utilization,
                2
            ),

            "load_imbalance": round(
                load_imbalance,
                2
            ),

            "servers_used": servers_used,

            "average_processing_time": round(
                average_processing_time,
                2
            ),

            "average_response_time": round(
                average_response_time,
                2
            )
        }