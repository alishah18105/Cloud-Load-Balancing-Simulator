from services.simulation import SimulationService


def print_single_result(result):

    print("\n" + "=" * 60)
    print("ALGORITHM:", result["algorithm"])
    print("=" * 60)

    print("\nREQUEST SUMMARY")

    print(
        f"Requests Sent:      {result['requests_sent']}"
    )

    print(
        f"Requests Accepted:  {result['requests_accepted']}"
    )

    print(
        f"Requests Rejected:  {result['requests_rejected']}"
    )

    print(
        f"Acceptance Rate:    {result['acceptance_rate']}%"
    )

    print(
        f"Rejection Rate:     {result['rejection_rate']}%"
    )

    print("\nSERVER RESULTS")

    for server in result["servers"]:

        print(
            f"Server {server['server_id']} | "
            f"Capacity: {server['capacity']} | "
            f"Load: {server['current_load']} | "
            f"Utilization: {server['load_percentage']}% | "
            f"Requests: {server['assigned_requests']}"
        )

    # print("\nREQUEST RESULTS")

    # for request in result["requests"]:

    #     print(
    #         f"Request {request['request_id']} | "
    #         f"Workload: {request['workload']} | "
    #         f"Priority: {request['priority']} | "
    #         f"Server: {request['assigned_server']} | "
    #         f"Status: {request['status']}"
    #     )


def print_comparison_result(result):

    print("\n" + "=" * 80)
    print("ALGORITHM COMPARISON")
    print("=" * 80)

    print(
        f"\nServers:  {result['number_of_servers']}"
    )

    print(
        f"Requests: {result['number_of_requests']}"
    )
    print(
    f"Workload Type:  {result['workload_type'].upper()}"
)

    # --------------------------------------------------
    # INITIAL SERVER CONFIGURATION
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("INITIAL SERVER CONFIGURATION")
    print("-" * 80)

    print(
        f"{'Server':<10}"
        f"{'Capacity':<12}"
        f"{'Processing Power':<18}"
        f"{'Initial Load':<15}"
    )

    print("-" * 55)

    for server in result["initial_servers"]:

        print(
            f"{server['server_id']:<10}"
            f"{server['capacity']:<12}"
            f"{server['processing_power']:<18}"
            f"{server['initial_load']:<15}"
        )

    # --------------------------------------------------
    # REQUEST SCENARIO
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("COMMON REQUEST SCENARIO")
    print("-" * 80)

    first_algorithm = next(
        iter(result["results"])
    )

    reference_requests = result["results"][
        first_algorithm
    ]["requests"]

    print(
        f"{'Request':<10}"
        f"{'Workload':<12}"
        f"{'Priority':<10}"
    )

    print("-" * 32)

    # for request in reference_requests:

    #     print(
    #         f"{request['request_id']:<10}"
    #         f"{request['workload']:<12}"
    #         f"{request['priority']:<10}"
    #     )

    # --------------------------------------------------
    # COMPARISON SUMMARY
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("COMPARISON SUMMARY")
    print("-" * 80)

    print(
        f"{'Algorithm':<25}"
        f"{'Sent':<10}"
        f"{'Accepted':<12}"
        f"{'Rejected':<12}"
        f"{'Acceptance %':<15}"
    )

    print("-" * 74)

    for algorithm, algorithm_result in result["results"].items():

        print(
            f"{algorithm:<25}"
            f"{algorithm_result['requests_sent']:<10}"
            f"{algorithm_result['requests_accepted']:<12}"
            f"{algorithm_result['requests_rejected']:<12}"
            f"{algorithm_result['acceptance_rate']:<15}"
        )

    # --------------------------------------------------
    # DETAILED RESULTS FOR EACH ALGORITHM
    # --------------------------------------------------

    for algorithm, algorithm_result in result["results"].items():

        print("\n")
        print("=" * 80)
        print("ALGORITHM:", algorithm.upper())
        print("=" * 80)

        print("\nREQUEST SUMMARY")

        print(
            f"Requests Sent:      "
            f"{algorithm_result['requests_sent']}"
        )

        print(
            f"Requests Accepted:  "
            f"{algorithm_result['requests_accepted']}"
        )

        print(
            f"Requests Rejected:  "
            f"{algorithm_result['requests_rejected']}"
        )

        print(
            f"Acceptance Rate:    "
            f"{algorithm_result['acceptance_rate']}%"
        )

        print(
            f"Rejection Rate:     "
            f"{algorithm_result['rejection_rate']}%"
        )

        # --------------------------------------------------
        # BEFORE → AFTER SERVER DETAILS
        # --------------------------------------------------

        print("\nSERVER DETAILS")

        print(
            f"{'Server':<10}"
            f"{'Capacity':<12}"
            f"{'Power':<10}"
            f"{'Before':<10}"
            f"{'After':<10}"
            f"{'Utilization':<15}"
            # f"{'Requests'}"
        )

        print("-" * 90)

        for server in algorithm_result["servers"]:

            print(
                f"{server['server_id']:<10}"
                f"{server['capacity']:<12}"
                f"{server['processing_power']:<10}"
                f"{0:<10}"
                f"{server['current_load']:<10}"
                f"{server['load_percentage']:<15}%"
                # f"{server['assigned_requests']}"
            )

        # --------------------------------------------------
        # REQUEST ASSIGNMENTS
        # --------------------------------------------------

        # print("\nREQUEST ASSIGNMENTS")

        # for request in algorithm_result["requests"]:

        #     print(
        #         f"Request {request['request_id']} | "
        #         f"Workload: {request['workload']} | "
        #         f"Priority: {request['priority']} | "
        #         f"Server: {request['assigned_server']} | "
        #         f"Status: {request['status']}"
        #     )

    print("\n")

service = SimulationService()


result = service.run_simulation(
    algorithm="all",
    number_of_requests=1000,
    number_of_servers=20,
    server_type="heterogeneous",
    workload_type="random"
)


if result.get("mode") == "comparison":
    print_comparison_result(result)
else:
    print_single_result(result)