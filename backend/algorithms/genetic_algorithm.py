import random


class GeneticAlgorithm:

    def __init__(
        self,
        population_size=50,
        generations=50,
        crossover_rate=0.8,
        mutation_rate=0.05
    ):
        self.population_size = population_size
        self.generations = generations
        self.crossover_rate = crossover_rate
        self.mutation_rate = mutation_rate

    def run(self, servers, requests):
        if not servers:
            raise ValueError("At least one server is required.")

        if not requests:
            return servers

        population = self._create_population(
            len(requests),
            len(servers)
        )

        best_chromosome = None
        best_fitness = float("-inf")

        for _ in range(self.generations):

            fitness_scores = [
                self._calculate_fitness(
                    chromosome,
                    servers,
                    requests
                )
                for chromosome in population
            ]

            current_best_index = fitness_scores.index(
                max(fitness_scores)
            )

            current_best_fitness = fitness_scores[
                current_best_index
            ]

            if current_best_fitness > best_fitness:
                best_fitness = current_best_fitness
                best_chromosome = population[
                    current_best_index
                ][:]

            new_population = []

            while len(new_population) < self.population_size:

                parent1 = self._tournament_selection(
                    population,
                    fitness_scores
                )

                parent2 = self._tournament_selection(
                    population,
                    fitness_scores
                )

                child1, child2 = self._crossover(
                    parent1,
                    parent2
                )

                child1 = self._mutate(
                    child1,
                    len(servers)
                )

                child2 = self._mutate(
                    child2,
                    len(servers)
                )

                new_population.append(child1)

                if len(new_population) < self.population_size:
                    new_population.append(child2)

            population = new_population

        self._apply_solution(
            best_chromosome,
            servers,
            requests
        )

        return servers

    def _create_population(
        self,
        number_of_requests,
        number_of_servers
    ):
        population = []

        for _ in range(self.population_size):

            chromosome = [
                random.randrange(number_of_servers)
                for _ in range(number_of_requests)
            ]

            population.append(chromosome)

        return population

    def _calculate_fitness(
        self,
        chromosome,
        servers,
        requests
    ):
        loads = [0] * len(servers)

        rejected_requests = 0

        for request_index, server_index in enumerate(
            chromosome
        ):
            request = requests[request_index]

            server = servers[server_index]

            # Check whether assigning this request would
            # exceed the server's capacity.
            if (
                loads[server_index] + request.workload
                <= server.capacity
            ):
                loads[server_index] += request.workload

            else:
                rejected_requests += 1

        utilization = []

        for index, server in enumerate(servers):

            if server.capacity == 0:
                utilization.append(0)
            else:
                utilization.append(
                    (
                        loads[index]
                        / server.capacity
                    ) * 100
                )

        max_utilization = max(utilization)
        min_utilization = min(utilization)

        imbalance = (
            max_utilization - min_utilization
        )

        # Strongly penalize rejected requests.
        rejection_penalty = rejected_requests * 100

        return 1 / (
            1
            + imbalance
            + rejection_penalty
        )

    def _tournament_selection(
        self,
        population,
        fitness_scores
    ):
        tournament_size = 3

        selected_indices = random.sample(
            range(len(population)),
            min(
                tournament_size,
                len(population)
            )
        )

        winner = max(
            selected_indices,
            key=lambda index: fitness_scores[index]
        )

        return population[winner][:]

    def _crossover(self, parent1, parent2):

        if (
            len(parent1) < 2
            or random.random() > self.crossover_rate
        ):
            return parent1[:], parent2[:]

        crossover_point = random.randint(
            1,
            len(parent1) - 1
        )

        child1 = (
            parent1[:crossover_point]
            + parent2[crossover_point:]
        )

        child2 = (
            parent2[:crossover_point]
            + parent1[crossover_point:]
        )

        return child1, child2

    def _mutate(
        self,
        chromosome,
        number_of_servers
    ):
        for index in range(len(chromosome)):

            if random.random() < self.mutation_rate:

                chromosome[index] = random.randrange(
                    number_of_servers
                )

        return chromosome

    def _apply_solution(
        self,
        chromosome,
        servers,
        requests
    ):
        if chromosome is None:
            return

        # Reset previous assignments
        for request in requests:
            request.assigned_server = None

        for server in servers:
            server.assigned_requests = []
            server.current_load = 0

        # Apply the chromosome while respecting capacity.
        for request_index, server_index in enumerate(
            chromosome
        ):
            request = requests[request_index]

            server = servers[server_index]

            if (
                server.current_load + request.workload
                <= server.capacity
            ):
                server.assign_request(request)
                request.assign_server(server)

            else:
                # No capacity available for this request.
                request.assigned_server = None