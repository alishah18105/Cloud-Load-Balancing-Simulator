from services.simulation import SimulationService


def print_single_result(result):

    print("\n" + "=" * 80)
    print("SINGLE ALGORITHM RESULT")
    print("=" * 80)

    print("\nALGORITHM")
    print(result["algorithm"].upper())

    config = result["configuration"]
    summary = result["summary"]
    metrics = result["metrics"]

    print("\nCONFIGURATION")
    print(f"Servers:       {config['number_of_servers']}")
    print(f"Requests:      {config['number_of_requests']}")
    print(f"Server Type:   {config['server_type']}")
    print(f"Workload Type: {config['workload_type'].upper()}")

    print("\nREQUEST SUMMARY")

    print(f"Requests Sent:      {summary['requests_sent']}")
    print(f"Requests Accepted:  {summary['requests_accepted']}")
    print(f"Requests Rejected:  {summary['requests_rejected']}")
    print(f"Acceptance Rate:    {summary['acceptance_rate']}%")
    print(f"Rejection Rate:     {summary['rejection_rate']}%")

    print("\nLOAD BALANCING METRICS")

    print(
        f"Average Utilization: {metrics['average_utilization']}%"
    )

    print(
        f"Maximum Utilization: {metrics['maximum_utilization']}%"
    )

    print(
        f"Minimum Utilization: {metrics['minimum_utilization']}%"
    )

    print(
        f"Load Imbalance:      {metrics['load_imbalance']}%"
    )

    print(
        f"Servers Used:        {metrics['servers_used']}"
    )

    print("\nPERFORMANCE METRICS")

    print(
        f"Average Processing Time: "
        f"{metrics['average_processing_time']}"
    )

    print(
        f"Average Response Time:   "
        f"{metrics['average_response_time']}"
    )

    print("\nSERVER RESULTS")

    print(
        f"{'Server':<10}"
        f"{'Capacity':<12}"
        f"{'Power':<10}"
        f"{'Initial':<12}"
        f"{'Final':<12}"
        f"{'Utilization':<15}"
    )

    print("-" * 75)

    for server in result["servers"]:

        print(
            f"{server['server_id']:<10}"
            f"{server['capacity']:<12}"
            f"{server['processing_power']:<10}"
            f"{server['initial_load']:<12}"
            f"{server['final_load']:<12}"
            f"{server['utilization']:<15}%"
        )


def print_comparison_result(result):

    print("\n" + "=" * 80)
    print("ALGORITHM COMPARISON")
    print("=" * 80)

    config = result["configuration"]

    print("\nCONFIGURATION")

    print(
        f"Servers:       {config['number_of_servers']}"
    )

    print(
        f"Requests:      {config['number_of_requests']}"
    )

    print(
        f"Server Type:   {config['server_type'].upper()}"
    )

    print(
        f"Workload Type: {config['workload_type'].upper()}"
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
    )

    print("-" * 40)

    for server in result["initial_servers"]:

        print(
            f"{server['server_id']:<10}"
            f"{server['capacity']:<12}"
            f"{server['processing_power']:<18}"
        )

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

        summary = algorithm_result["summary"]

        print(
            f"{algorithm:<25}"
            f"{summary['requests_sent']:<10}"
            f"{summary['requests_accepted']:<12}"
            f"{summary['requests_rejected']:<12}"
            f"{summary['acceptance_rate']:<15}"
        )

    # --------------------------------------------------
    # LOAD BALANCING COMPARISON
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("LOAD BALANCING METRICS")
    print("-" * 80)

    print(
        f"{'Algorithm':<25}"
        f"{'Avg Util.':<15}"
        f"{'Max Util.':<15}"
        f"{'Min Util.':<15}"
        f"{'Imbalance':<15}"
        f"{'Servers Used':<15}"
    )

    print("-" * 100)

    for algorithm, algorithm_result in result["results"].items():

        metrics = algorithm_result["metrics"]

        print(
            f"{algorithm:<25}"
            f"{metrics['average_utilization']:<15}"
            f"{metrics['maximum_utilization']:<15}"
            f"{metrics['minimum_utilization']:<15}"
            f"{metrics['load_imbalance']:<15}"
            f"{metrics['servers_used']:<15}"
        )

    # --------------------------------------------------
    # PERFORMANCE COMPARISON
    # --------------------------------------------------

    print("\n" + "-" * 80)
    print("PERFORMANCE METRICS")
    print("-" * 80)

    print(
        f"{'Algorithm':<25}"
        f"{'Avg Processing':<20}"
        f"{'Avg Response':<20}"
    )

    print("-" * 70)

    for algorithm, algorithm_result in result["results"].items():

        metrics = algorithm_result["metrics"]

        print(
            f"{algorithm:<25}"
            f"{metrics['average_processing_time']:<20}"
            f"{metrics['average_response_time']:<20}"
        )

    # --------------------------------------------------
    # DETAILED RESULTS
    # --------------------------------------------------

    for algorithm, algorithm_result in result["results"].items():

        print("\n")
        print("=" * 80)
        print("ALGORITHM:", algorithm.upper())
        print("=" * 80)

        summary = algorithm_result["summary"]

        print("\nREQUEST SUMMARY")

        print(
            f"Requests Sent:      "
            f"{summary['requests_sent']}"
        )

        print(
            f"Requests Accepted:  "
            f"{summary['requests_accepted']}"
        )

        print(
            f"Requests Rejected:  "
            f"{summary['requests_rejected']}"
        )

        print(
            f"Acceptance Rate:    "
            f"{summary['acceptance_rate']}%"
        )

        print(
            f"Rejection Rate:     "
            f"{summary['rejection_rate']}%"
        )

        # --------------------------------------------------
        # SERVER DETAILS
        # --------------------------------------------------

        print("\nSERVER DETAILS")

        print(
            f"{'Server':<10}"
            f"{'Capacity':<12}"
            f"{'Power':<10}"
            f"{'Initial':<12}"
            f"{'Final':<12}"
            f"{'Utilization':<15}"
        )

        print("-" * 75)

        for server in algorithm_result["servers"]:

            print(
                f"{server['server_id']:<10}"
                f"{server['capacity']:<12}"
                f"{server['processing_power']:<10}"
                f"{server['initial_load']:<12}"
                f"{server['final_load']:<12}"
                f"{server['utilization']:<15}%"
            )


# ------------------------------------------------------
# RUN TEST
# ------------------------------------------------------

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