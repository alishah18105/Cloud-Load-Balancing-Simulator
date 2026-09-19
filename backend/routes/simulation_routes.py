from flask import Blueprint, request, jsonify

from services.simulation import SimulationService


simulation_bp = Blueprint(
    "simulation",
    __name__,
    url_prefix="/api"
)

simulation_service = SimulationService()


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