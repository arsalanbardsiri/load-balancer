# System Design Notes

## Evolution: 2-Tier and 3-Tier Architecture

### The Problem with Single Server
With the growth of the user base, one server is not sufficient. We need multiple servers:
- **Web/Mobile Traffic (Web Tier)**: Handles HTTP requests, application logic.
- **Database (Data Tier)**: Stores user data persistently.

Separating these concerns allows them to be scaled independently.

### Database Options

#### Relational Databases (RDBMS)
- **Examples**: MySQL, Oracle, PostgreSQL.
- **Structure**: **Tables** and **Rows**.
- **Key Feature**: SQL for data manipulation, supports joins.
- **Best for**: Structured data, complex relationships, ensuring data integrity (ACID properties).

#### Non-Relational Databases (NoSQL)
- **Examples**: CouchDB, Neo4j, Cassandra, DynamoDB.
- **Categories**: Key-value, Graph, Column, Document.
- **Key Feature**: Flexible schema, generally no joins.
- **Best for**: Super-low latency, unstructured data, massive scale, simple serialization (JSON/XML).

### Our Choice: PostgreSQL
We are choosing a **Relational Database (PostgreSQL)**.

#### What is a Schema?
In the context of a relational database, a **Schema** is the blueprint that defines the structure of your data. It organizes data into **Tables**, where each table has:
- **Columns**: Define the type of data (e.g., `first_name` which is text, `id` which is a number).
- **Rows**: The actual data records (e.g., "John Doe").

We defined our schema using SQL (Structured Query Language).

### Secret Management (Security Best Practices)
When dealing with databases, we have sensitive information like passwords.
- **NEVER** commit secrets (passwords, API keys) to version control (GitHub).
- **USE** Environment Variables. We use a `.env` file to store these secrets locally.
- **IGNORE** the `.env` file using `.gitignore` so it doesn't get uploaded.

In our architecture:
- Docker reads the `.env` file to configure the database.
- Our Node.js scripts use `dotenv` to read the same variables to connect.
