class Server:
    def __init__(self, server_id, capacity=100, processing_power=1.0):
        self.server_id = server_id
        self.capacity = capacity
        self.processing_power = processing_power

        self.assigned_requests = []
        self.current_load = 0

    def assign_request(self, request):
        self.assigned_requests.append(request)
        self.current_load += request.workload

    def get_load_percentage(self):
        if self.capacity == 0:
            return 0

        return (self.current_load / self.capacity) * 100