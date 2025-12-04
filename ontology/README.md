# Ontology Engine

[中文](README.zh.md) | English

## Project Overview

The Ontology Engine is a distributed business knowledge network management system developed in Go, providing ontology modeling, data management, and intelligent query capabilities. The system adopts a microservices architecture, divided into ontology management and ontology query modules, supporting the construction, storage, and querying of large-scale knowledge networks.

### Core Features

- **Ontology Modeling & Management**: Supports definition and management of object types, relation types, and action types
- **Knowledge Network Construction**: Build multi-domain knowledge networks with complex semantic relationships
- **Intelligent Query Engine**: Provides powerful knowledge network query capabilities, supporting complex relationship queries
- **Data Integration**: Integrates multiple data sources through the VEGA virtualization engine
- **Distributed Architecture**: Microservices-based design supporting horizontal scaling
- **OpenSearch Integration**: Integrated OpenSearch for efficient search capabilities

## System Architecture

### Module Structure

```text
kweaver/
└── ontology/
    ├── ontology-manager/     # Ontology Management Module
    └── ontology-query/       # Ontology Query Module
```

### Ontology Manager Module (ontology-manager)

Responsible for creating, editing, and managing ontology models. Main features include:

- **Knowledge Network Management**: Build and manage business knowledge networks
- **Object Type Management**: Define and manage object types in knowledge networks
- **Relation Type Management**: Define and manage relation types in knowledge networks
- **Action Type Management**: Define executable operations and actions
- **Job Scheduling**: Background task and job management

### Ontology Query Module (ontology-query)

Provides efficient knowledge graph query services. Main features include:

- **Model Query**: Query and browse ontology models
- **Graph Query**: Complex relationship path queries
- **Semantic Search**: Semantic-based intelligent search
- **Data Retrieval**: Multi-dimensional data filtering and retrieval

## Quick Start

### Prerequisites

- Go 1.23.0 or higher
- MariaDB 11.4+ or DM8 (for data storage)
- OpenSearch 2.x (for search and indexing)
- Docker (optional, for containerized deployment)
- Kubernetes (optional, for cluster deployment)

### Local Development

#### 1. Clone the repository

```bash
git clone https://github.com/AISHU-Technology/kweaver.git
cd kweaver/ontology
```

#### 2. Configure environment

Each module has its own configuration file:

- `ontology-manager/server/config/ontology-manager-config.yaml`
- `ontology-query/server/config/ontology-query-config.yaml`

#### 3. Run the Ontology Manager module

```bash
cd ontology-manager/server
go mod download
go run main.go
```

The service will start at `http://localhost:13014`

#### 4. Run the Ontology Query module

```bash
cd ../ontology-query/server
go mod download
go run main.go
```

The service will start at `http://localhost:13018`

### Docker Deployment

#### Build images

```bash
# Build Ontology Manager module
cd ontology-manager
docker build -t ontology-manager:latest -f docker/Dockerfile .

# Build Ontology Query module  
cd ../ontology-query
docker build -t ontology-query:latest -f docker/Dockerfile .
```

#### Run containers

```bash
# Run Ontology Manager module
docker run -d -p 13014:13014 --name ontology-manager ontology-manager:latest

# Run Ontology Query module
docker run -d -p 13018:13018 --name ontology-query ontology-query:latest
```

### Kubernetes Deployment

The project provides Helm charts for Kubernetes deployment:

```bash
# Deploy Ontology Manager module
helm3 install ontology-manager ontology-manager/helm/ontology-manager/

# Deploy Ontology Query module
helm3 install ontology-query ontology-query/helm/ontology-query/
```

## API Documentation

The system provides complete RESTful API documentation:

### Ontology Manager APIs

- [Knowledge Network API](ontology-manager/api_doc/ontology-manager-network.html)
- [Object Type API](ontology-manager/api_doc/ontology-manager-object-type.html)
- [Relation Type API](ontology-manager/api_doc/ontology-manager-relation-type.json)
- [Action Type API](ontology-manager/api_doc/ontology-manager-action-type.html)
- [Job Management API](ontology-manager/api_doc/ontology-manager-job-api.html)

### Ontology Query APIs

- [Query Service API](ontology-query/api/ontology-query.html)

## Database Support

The system supports multiple databases:

- **MariaDB**: Primary data storage
- **DM8**: DM8 database support
- **OpenSearch**: Search engine and data analysis

Database migration scripts are located at:

- `ontology-manager/migrations/`
- `ontology-query/migrations/`

## Monitoring & Logging

- **Logging System**: Integrated structured logging with multi-level log recording
- **Distributed Tracing**: OpenTelemetry-based distributed tracing
- **Health Checks**: Health check endpoints provided

## Development Guide

### Code Structure

```text
server/
├── common/          # Common configuration and constants
├── config/          # Configuration files
├── drivenadapters/  # Data access layer
├── driveradapters/  # Interface adapter layer
├── errors/          # Error definitions
├── interfaces/      # Interface definitions
├── locale/          # Internationalization
├── logics/          # Business logic layer
├── main.go          # Application entry point
├── version/         # Version information
└── worker/          # Background tasks
```

### Development Standards

1. **Modular Design**: Follow clean architecture principles
2. **Interface Isolation**: Clearly define interfaces and implementations
3. **Error Handling**: Unified error handling mechanism
4. **Logging Standards**: Structured logging
5. **Test Coverage**: Unit tests and integration tests

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## Version History

- **v6.1.0**: Current version, based on Go 1.23

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](../../LICENSE.txt) file for details.

## Support & Contact

- **Technical Support**: AISHU ADP R&D Team
- **Documentation Updates**: Continuously updated
- **Issue Reporting**: Submit through internal system

---

**Note**: This is an enterprise-level internal project. Code and documentation may contain specific business logic and configurations. Please adjust according to your actual environment.
