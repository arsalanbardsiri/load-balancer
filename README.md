# Load Balancer Architecture Demo

This project demonstrates the implementation of a Load Balancer (Nginx) in front of multiple Web Servers (Node.js) which connect to a Data Tier (PostgreSQL).

## Architecture

```mermaid
graph TD
    User((User)) -->|HTTP:80| LB[Load Balancer (Nginx)]
    LB -->|Round Robin| Web1[Web Server 1 (Node.js)]
    LB -->|Round Robin| Web2[Web Server 2 (Node.js)]
    Web1 <-->|Internal Network| DB[(Database Tier\nPostgreSQL)]
    Web2 <-->|Internal Network| DB
    
    subgraph "Private Network (Docker)"
    LB
    Web1
    Web2
    DB
    end
```

- **Load Balancer**: Nginx (exposes Port 80). Entry point for all traffic.
- **Web Tier**: Multiple instances of Node.js app (Private, Port 3000). Not accessible directly from internet.
- **Data Tier**: PostgreSQL (Private, Port 5432). Accessible only by Web Tier.

## Prerequisites

- **Docker & Docker Compose**: Installed and running.

## Getting Started

### 1. Configuration (Secrets)
Create a `.env` file in the project root if it doesn't exist:
```env
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
```

### 2. Start the System
Run the entire stack (Load Balancer, Web Servers, Database) with one command. We will scale the web tier to **2 instances**.

```bash
docker-compose up -d --build --scale web=2
```

### 3. Initialize the Database
Since the database is fresh, we need to create the table and seed data. We run this script *inside* one of the web containers:

```bash
docker-compose exec web node db_init.js
```

### 4. Verify Operation & Load Balancing
Open your browser or use curl to visit `http://localhost/users/1`. 
Refresh multiple times to see the `server_id` change, indicating that Nginx is balancing traffic between `web-1` and `web-2`.

```bash
# Windows Command Prompt
curl http://localhost/users/1
```

Response Example:
```json
{
  "id": 1,
  "first_name": "John",
  "server_id": "7ec480d852d9"  <-- Container ID
}
```

## Failover Test
To test high availability:
1.  Identify a running container ID from the `server_id` in the response.
2.  Stop that specific container: `docker stop <container_id>`
3.  Refresh the page (`http://localhost/users/1`).
4.  The site should remain up, served by the remaining healthy instance.

## Project Structure
- `nginx.conf`: Nginx configuration for reverse proxy and load balancing.
- `Dockerfile`: Instructions to containerize the Node.js app.
- `docker-compose.yml`: Orchestration for Nginx, Web (xN), and DB.
- `server.js`: Web App logic (now returns `server_id`).
- `db.js`: Database connection (configured for dynamic host).

