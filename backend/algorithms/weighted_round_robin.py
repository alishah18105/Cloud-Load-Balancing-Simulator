class WeightedRoundRobin:

    def run(self, servers, requests):
        if not servers:
            raise ValueError("At least one server is required.")

        weighted_servers = []

        for server in servers:
            weight = max(1, round(server.processing_power))

            for _ in range(weight):
                weighted_servers.append(server)

        if not weighted_servers:
            return servers

        weighted_count = len(weighted_servers)

        for index, request in enumerate(requests):

            assigned = False

            # Start from the normal weighted round-robin position
            start_index = index % weighted_count

            # Check every weighted position once
            for offset in range(weighted_count):

                weighted_index = (
                    start_index + offset
                ) % weighted_count

                server = weighted_servers[weighted_index]

                # Check CPU capacity before accepting request
                if (
                    server.current_load + request.workload
                    <= server.capacity
                ):
                    server.assign_request(request)
                    request.assign_server(server)

                    assigned = True
                    break

            # No server had enough capacity
            if not assigned:
                request.assigned_server = None

        return servers