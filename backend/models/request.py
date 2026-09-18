class Request:
    def __init__(self, request_id, workload=10, priority=1):
        self.request_id = request_id
        self.workload = workload
        self.priority = priority

        self.assigned_server = None

    def assign_server(self, server):
        self.assigned_server = server