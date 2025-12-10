# System Design Notes: Load Balancer Architecture

This document details the architectural evolution from a single-instance server to a load-balanced, containerized web tier. 

## The Core Concept: Load Balancing
A **Load Balancer** acts as the single entry point for all incoming traffic. It distributes requests across multiple web servers (the "server pool") to ensure no single server becomes a bottleneck.

### Benefits
1.  **Horizontal Scaling**: We can add more efficient, smaller web servers rather than upgrading a single massive server.
2.  **High Availability (Failover)**: If one server crashes, the load balancer detects it and routes traffic to the healthy servers. The user experiences no downtime.
3.  **Security**: The web servers are hidden inside a private network. Only the load balancer is exposed to the internet.

## Architecture Diagram

```mermaid
graph TD
    User((User)) -->|"Public IP (Port 80)"| LB[Nginx Load Balancer]
    
    subgraph "Private Network (Docker Internal)"
    LB -->|Round Robin Strategy| Web1[Node.js Instance 1]
    LB -->|Round Robin Strategy| Web2[Node.js Instance 2]
    Web1 -->|Private TCP (Port 5432)| DB[(PostgreSQL Database)]
    Web2 -->|Private TCP (Port 5432)| DB
    end
    
    style LB fill:#f9f,stroke:#333
    style Web1 fill:#bbf,stroke:#333
    style Web2 fill:#bbf,stroke:#333
```

## Detailed Implementation Steps

We achieved this architecture through 4 key technical changes.

### 1. The Traffic Cop: Nginx Configuration
**Goal**: Create a service that listens on Port 80 and forwards to *any* available web container.

**File**: `nginx.conf`
```nginx
http {
    # UPSTREAM BLOCK
    # "web" is the hostname defined in docker-compose.
    # Docker DNS resolves this single name to the IP addresses of ALL containers in that service.
    upstream web_app {
        server web:3000;
    }

    server {
        listen 80;

        location / {
            # PROXY PASS
            # Forwards the request to the upstream group defined above.
            proxy_pass http://web_app;
            
            # Headers to ensure the app knows the real client IP, not just Nginx's IP
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 2. Containerizing the App: Dockerfile
**Goal**: Package the Node.js app so we can spin up identical copies instantly without manual setup.

**File**: `Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the INTERNAL port
EXPOSE 3000

CMD ["node", "server.js"]
```

### 3. Networking & Orchestration: Docker Compose
**Goal**: Define the network topology. The Web App must be private, and Nginx must be the public gateway.

**File**: `docker-compose.yml`
```yaml
services:
  # 1. DATABASE
  db:
    image: postgres:15
    # ... existing config ...

  # 2. WEB APPLICATION (The Backend)
  web:
    build: .             # Build from our new Dockerfile
    # NOTE: No "ports" mapping here!
    # This keeps port 3000 CLOSED to the outside world.
    # Only accessible by other services in this network.
    environment:
      DB_HOST: db        # Tell app where to find the database
    depends_on:
      - db

  # 3. LOAD BALANCER (The Gateway)
  nginx:
    image: nginx:latest
    ports:
      - "80:80"          # The only PUBLIC port
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - web
```

### 4. Code Adjustments for Observability
**Goal**: Verify that requests are actually hitting different servers.

**File**: `server.js`
We added `os.hostname()` to the response. In a Docker container, the hostname is the unique **Container ID**.

```javascript
const os = require('os'); // Import OS module

app.get('/users/:id', async (req, res) => {
    // ... query logic ...
    
    // Return data PLUS the server_id
    res.json({ 
        ...result.rows[0], 
        server_id: os.hostname() 
    });
});
```

---

## Verification: How to Prove it Works?

### 1. Load Balancing Test
Run the command `curl http://localhost/users/1` multiple times.
You will see the `server_id` change between requests as Nginx uses the default **Round Robin** algorithm.

*   Request 1 -> Server ID: `7ec480d852d9`
*   Request 2 -> Server ID: `75779ee1dd8b`
*   Request 3 -> Server ID: `7ec480d852d9`

### 2. Failover Test
If you kill one server, the site stays up.
1.  Identify a server ID (e.g., `7ec480d852d9`).
2.  Run `docker stop 7ec480d852d9`.
3.  Refresh the page immediately.
4.  **Result**: Nginx detects the failure and routes 100% of traffic to the remaining healthy server (`75779ee1dd8b`).
