class RoundRobin:

    def run(self, servers, requests):
        if not servers:
            raise ValueError("At least one server is required.")

        server_count = len(servers)

        for index, request in enumerate(requests):

            assigned = False

            # Start from the normal Round Robin position
            start_index = index % server_count

            # Check every server once
            for offset in range(server_count):

                server_index = (
                    start_index + offset
                ) % server_count

                server = servers[server_index]

                # Check CPU capacity before accepting request
                if (
                    server.current_load + request.workload
                    <= server.capacity
                ):
                    server.assign_request(request)
                    request.assign_server(server)

                    assigned = True
                    break

            # If no server has enough capacity,
            # request remains unassigned/rejected.
            if not assigned:
                request.assigned_server = None

        return servers