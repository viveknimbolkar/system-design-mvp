# Load Balancing

### Nginx traffic routing algorithms
1. round-robin - server requests one by one to each server
2. least_conn - route to the free servers having least connections
3. ip_hash - hash the ip and route to specific server only permanently. Its good for in-memory session apps
4. hash - same likf ip_hash
