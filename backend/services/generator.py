import random

from models.server import Server
from models.request import Request


class SimulationGenerator:

    def generate_servers(self, number_of_servers, server_type):
        servers = []

        for i in range(number_of_servers):

            if server_type.lower() == "homogeneous":
                capacity = 1000
                processing_power = 4.0

            elif server_type.lower() == "heterogeneous":
                capacity = random.choice(
                    [800, 1000, 1200, 1500, 2000]
                )

                processing_power = random.choice(
                    [3.0, 4.0, 5.0, 6.0, 7.0]
                )

            else:
                raise ValueError(
                    "Server type must be Homogeneous or Heterogeneous"
                )

            server = Server(
                server_id=i + 1,
                capacity=capacity,
                processing_power=processing_power
            )

            servers.append(server)

        return servers

    def generate_requests(
        self,
        number_of_requests,
        workload_type
    ):
        requests = []

        for i in range(number_of_requests):

            workload = self._generate_workload(
                workload_type
            )

            priority = random.randint(1, 5)

            request = Request(
                request_id=i + 1,
                workload=workload,
                priority=priority
            )

            requests.append(request)

        return requests

    def _generate_workload(self, workload_type):

        workload_type = workload_type.lower()

        if workload_type == "light":
            return random.randint(5, 20)

        elif workload_type == "medium":
            return random.randint(20, 50)

        elif workload_type == "heavy":
            return random.randint(50, 100)

        elif workload_type == "random":
            return random.randint(5, 100)

        else:
            raise ValueError(
                "Workload must be Light, Medium, Heavy, or Random"
            )