from flask import Blueprint, request, jsonify

from services.simulation import SimulationService
from services.timeline import TimelineSimulator


simulation_bp = Blueprint(
    "simulation",
    __name__,
    url_prefix="/api"
)

simulation_service = SimulationService()

timeline_simulator = TimelineSimulator()


@simulation_bp.route("/simulate", methods=["POST"])
def simulate():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Request body is required."
            }), 400

        algorithm = data.get("algorithm")
        number_of_requests = data.get("number_of_requests")
        number_of_servers = data.get("number_of_servers")
        server_type = data.get("server_type")
        workload_type = data.get("workload_type")

        if not algorithm:
            return jsonify({
                "error": "Algorithm is required."
            }), 400

        if number_of_requests is None:
            return jsonify({
                "error": "Number of requests is required."
            }), 400

        if number_of_servers is None:
            return jsonify({
                "error": "Number of servers is required."
            }), 400

        if not server_type:
            return jsonify({
                "error": "Server type is required."
            }), 400

        if not workload_type:
            return jsonify({
                "error": "Workload type is required."
            }), 400

        result = simulation_service.run_simulation(
            algorithm=algorithm,
            number_of_requests=int(number_of_requests),
            number_of_servers=int(number_of_servers),
            server_type=server_type,
            workload_type=workload_type
        )

        return jsonify(result), 200

    except ValueError as error:

        return jsonify({
            "error": str(error)
        }), 400

    except Exception as error:

        return jsonify({
            "error": "An unexpected error occurred.",
            "details": str(error)
        }), 500


@simulation_bp.route("/simulate/timeline", methods=["POST"])
def simulate_timeline():
    """
    Discrete-event version of the simulation.

    Unlike /api/simulate, requests arrive over time and completed requests
    release their workload, so capacity behaves as a concurrency limit
    rather than a lifetime total.
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Request body is required."
            }), 400

        algorithm = data.get("algorithm")
        number_of_requests = data.get("number_of_requests")
        number_of_servers = data.get("number_of_servers")
        server_type = data.get("server_type")
        workload_type = data.get("workload_type")

        if not algorithm:
            return jsonify({
                "error": "Algorithm is required."
            }), 400

        if algorithm.lower() == "all":
            return jsonify({
                "error": (
                    "Timeline mode runs one algorithm at a time. "
                    "Use /api/simulate for comparison mode."
                )
            }), 400

        if number_of_requests is None:
            return jsonify({
                "error": "Number of requests is required."
            }), 400

        if number_of_servers is None:
            return jsonify({
                "error": "Number of servers is required."
            }), 400

        if not server_type:
            return jsonify({
                "error": "Server type is required."
            }), 400

        if not workload_type:
            return jsonify({
                "error": "Workload type is required."
            }), 400

        # 0 means a burst: every request arrives at once.
        arrival_rate = data.get("arrival_rate", 0)

        try:
            arrival_rate = float(arrival_rate)
        except (TypeError, ValueError):
            return jsonify({
                "error": "Arrival rate must be a number."
            }), 400

        if arrival_rate < 0:
            return jsonify({
                "error": "Arrival rate cannot be negative."
            }), 400

        result = timeline_simulator.run(
            algorithm=algorithm,
            number_of_requests=int(number_of_requests),
            number_of_servers=int(number_of_servers),
            server_type=server_type,
            workload_type=workload_type,
            arrival_rate=arrival_rate
        )

        return jsonify(result), 200

    except ValueError as error:

        return jsonify({
            "error": str(error)
        }), 400

    except Exception as error:

        return jsonify({
            "error": "An unexpected error occurred.",
            "details": str(error)
        }), 500
