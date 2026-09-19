from flask import Flask
from flask_cors import CORS

from routes.simulation_routes import simulation_bp


def create_app():

    app = Flask(__name__)

    CORS(app)

    app.register_blueprint(simulation_bp)

    @app.route("/")
    def home():
        return {
            "message": "Load Balancer Simulator API is running."
        }

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )