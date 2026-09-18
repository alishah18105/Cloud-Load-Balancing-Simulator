class LeastLoad:

    def run(self, servers, requests):
        if not servers:
            raise ValueError("At least one server is required.")

        for request in requests:

            # Only consider servers that have enough
            # remaining capacity for this request.
            available_servers = [
                server
                for server in servers
                if (
                    server.current_load + request.workload
                    <= server.capacity
                )
            ]

            # If no server can accept the request,
            # leave it unassigned/rejected.
            if not available_servers:
                request.assigned_server = None
                continue

            # Select the server with the lowest utilization
            server = min(
                available_servers,
                key=lambda server: server.get_load_percentage()
            )

            server.assign_request(request)
            request.assign_server(server)

        return servers