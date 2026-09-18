class PriorityBased:

    def run(self, servers, requests):
        if not servers:
            raise ValueError("At least one server is required.")

        # Highest priority first
        sorted_requests = sorted(
            requests,
            key=lambda request: request.priority,
            reverse=True
        )

        for request in sorted_requests:

            # Only consider servers that can accommodate
            # the request without exceeding capacity.
            available_servers = [
                server
                for server in servers
                if (
                    server.current_load + request.workload
                    <= server.capacity
                )
            ]

            # No server can accept the request
            if not available_servers:
                request.assigned_server = None
                continue

            # Among available servers, select the
            # server with the lowest utilization.
            server = min(
                available_servers,
                key=lambda server: server.get_load_percentage()
            )

            server.assign_request(request)
            request.assign_server(server)

        return servers