# 本体引擎 (Ontology Engine)

[中文](README.md) | [English](README.en.md)

## 项目简介

本体引擎是一个基于Go语言开发的分布式业务知识网络管理系统，提供本体建模、数据管理和智能查询功能。该系统采用微服务架构，分为本体管理模块和本体查询模块，支持大规模知识网络的构建、存储和查询。

### 核心特性

- **本体建模与管理**: 支持对象类、关系类、行动类的定义和管理
- **知识网络构建**: 构建多领域的知识网络，支持复杂的语义关系
- **智能查询引擎**: 提供强大的知识网络查询能力，支持复杂的关系查询
- **数据集成**: 通过VEGA虚拟化引擎集成多种数据源
- **分布式架构**: 基于微服务设计，支持水平扩展
- **OpenSearch集成**: 集成OpenSearch提供高效的搜索能力

## 系统架构

### 模块组成

```text
kweaver/
└── ontology/
    ├── ontology-manager/     # 本体管理模块
    └── ontology-query/       # 本体查询模块
```

### 本体管理模块 (ontology-manager)

负责本体模型的创建、编辑和管理，主要功能包括：

- **知识网络管理**: 构建和管理业务知识网络
- **对象类管理**: 定义和管理知识网络中的对象类
- **关系类管理**: 定义和管理知识网络中的关系类
- **行动类管理**: 定义可执行的操作和行动
- **任务调度**: 后台任务和作业管理

### 本体查询模块 (ontology-query)

提供高效的知识图谱查询服务，主要功能包括：

- **模型查询**: 本体模型的查询和浏览
- **图谱查询**: 复杂的关系路径查询
- **语义搜索**: 基于语义的智能搜索
- **数据检索**: 多维度数据过滤和检索

## 快速开始

### 环境要求

- Go 1.23.0 或更高版本
- MariaDB 11.4+ 或 DM8（用于数据存储）
- OpenSearch 2.x（用于搜索和索引）
- Docker（可选，用于容器化部署）
- Kubernetes（可选，用于集群部署）

### 本地开发

#### 1. 克隆代码库

```bash
git clone https://github.com/AISHU-Technology/kweaver.git
cd kweaver/ontology
```

#### 2. 配置环境

每个模块都有独立的配置文件：

- `ontology-manager/server/config/ontology-manager-config.yaml`
- `ontology-query/server/config/ontology-query-config.yaml`

#### 3. 运行本体管理模块

```bash
cd ontology-manager/server
go mod download
go run main.go
```

服务将在 `http://localhost:13014` 启动

#### 4. 运行本体查询模块

```bash
cd ../ontology-query/server
go mod download
go run main.go
```

服务将在 `http://localhost:13018` 启动

### Docker 部署

#### 构建镜像

```bash
# 构建本体管理模块
cd ontology-manager
docker build -t ontology-manager:latest -f docker/Dockerfile .

# 构建本体查询模块  
cd ../ontology-query
docker build -t ontology-query:latest -f docker/Dockerfile .
```

#### 运行容器

```bash
# 运行本体管理模块
docker run -d -p 13014:13014 --name ontology-manager ontology-manager:latest

# 运行本体查询模块
docker run -d -p 13018:13018 --name ontology-query ontology-query:latest
```

### Kubernetes 部署

项目提供了Helm charts用于Kubernetes部署：

```bash
# 部署本体管理模块
helm3 install ontology-manager ontology-manager/helm/ontology-manager/

# 部署本体查询模块
helm3 install ontology-query ontology-query/helm/ontology-query/
```

## API 文档

系统提供完整的RESTful API文档：

### 本体管理API

- [知识网络API](ontology-manager/api_doc/ontology-manager-network.html)
- [对象类API](ontology-manager/api_doc/ontology-manager-object-type.html)
- [关系类API](ontology-manager/api_doc/ontology-manager-relation-type.json)
- [动作类API](ontology-manager/api_doc/ontology-manager-action-type.html)
- [任务管理API](ontology-manager/api_doc/ontology-manager-job-api.html)

### 本体查询API

- [查询服务API](ontology-query/api/ontology-query.html)

## 数据库支持

系统支持多种数据库：

- **MariaDB**: 主数据存储
- **DM8**: 达梦数据库支持
- **OpenSearch**: 搜索引擎和数据分析

数据库升级脚本位于：

- `ontology-manager/migrations/`
- `ontology-query/migrations/`

## 监控与日志

- **日志系统**: 集成结构化日志，支持多级别日志记录
- **链路追踪**: 基于OpenTelemetry的分布式链路追踪
- **健康检查**: 提供健康检查端点

## 开发指南

### 代码结构

```text
server/
├── common/          # 公共配置和常量
├── config/          # 配置文件
├── drivenadapters/  # 数据访问层
├── driveradapters/  # 接口适配层
├── errors/          # 错误定义
├── interfaces/      # 接口定义
├── locale/          # 国际化
├── logics/          # 业务逻辑层
├── main.go          # 应用入口
├── version/         # 版本信息
└── worker/          # 后台任务
```

### 开发规范

1. **模块化设计**: 遵循清洁架构原则
2. **接口隔离**: 明确定义接口和实现
3. **错误处理**: 统一的错误处理机制
4. **日志规范**: 结构化的日志记录
5. **测试覆盖**: 单元测试和集成测试

### 贡献指南

1. Fork 代码库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 版本历史

- **v6.1.0**: 当前版本，基于Go 1.23

## 许可证

本项目采用 Apache License 2.0 许可证。详情请参阅 [LICENSE](../../LICENSE.txt) 文件。

## 支持与联系

- **技术支持**: AISHU ADP研发团队
- **文档更新**: 持续更新中
- **问题反馈**: 通过内部系统提交

---

**注意**: 这是一个企业级内部项目，代码和文档可能包含特定的业务逻辑和配置。请根据实际环境进行相应的调整。
