
KWeaver 是开源的认知智能开发框架，为数据科学家、应用开发者和领域专家提供具有**快速的开发**能力、全面的 **开放性** 和 **高性能** 的知识网络生成及认知智能大模型框架。

## 🎉 Features
- 知识图谱构建自动化、可视化（实体识别、关系抽取、实体关系链接、实体关系抽取）
- 知识图谱数据可视化分析（实体关系分析、实体关系可视化、实体关系挖掘）
- 知识图谱数据集成（数据集成、数据共享、数据分析）
- 知识图谱资源管理（本体库、术语库、词库）
- 大模型提示词(prompt)工程和调试
- 大模型接入可视化配置

##  🚀 快速入门
- [Start with Docker](https://docs.kweaver.ai/0.2.0/deploy/docker/)

- [Start with Kubernetes](https://docs.kweaver.ai/0.2.0/deploy/docker/)

Click [Document](https://docs.kweaver.ai/) for more information

## 🔨 安装

KWeaver 项目基于容器化方式，项目提供了 docker-compose 来启动。启动方式如下:

```bash
 git clone https://github.com/AISHU-Technology/kweaver.git
 cd kweaver/docker
 docker-compose up -d
```
## 🤝  Contribution
### 1、 开发语言
- Python >= 3.9
- Go >= 1.20
- Node >= 18.12.1
- React >= 18.2.0
- Ant-Design >= 4.18.7
- G6 >= 4.8.7
- Webpack >= 5.5.0

### 2、 开发环境支持
- Windows 10
- Linux (AMD64、ARM64)
- Docker 24.0.6

### 3、初始化脚本

- 初始化mysql数据库脚本: mysql_init.sql
- 创建nebula用户和授权:
```
登录http://xx.xx.xx.xx:7001 并执行创建用户脚本:
CREATE SPACE kweaver(partition_num=10, replica_factor=1, vid_type=FIXED_STRING(30));
CREATE USER IF NOT EXISTS kweaver WITH PASSWORD 'Kw1ea2ver!3';
GRANT ROLE ADMIN ON kweaver TO kweaver;
```
- 向量模型: 图谱构建时结合向量模型构建本地知识库，用于大模型记忆和向量相似检索
  - 外连模型：添加kw-builder环境变量VECTOR_URL向量模型（M3E）连接地址
  - 内置模型，如下两种方式：
    - 1、使用kw-models-m3e镜像中微调后的模型(支持GPU、CPU),GPU支持类型cuda和mps。下载镜像地址：docker pull kweaverai/kw-models-m3e:v0.2.0-arm64或docker pull kweaverai/kw-models-m3e:v0.2.0-amd64
    - 2、在modelscope、huggingface.co中下载M3E模型放入kw-models-m3e/models下进行使用

### 4、访问地址

- 本地访问地址： http://localhost:3001

### 5、依赖中间件

- Mysql ：系统配置持久化
- MongoDB ：中间数据存储
- Redis：全局缓存
- OpenSearch: 知识图谱检索、大模型向量检索和本地知识库
- Nebula: 图数据存储
- Nginx: 反向代理和负载均衡

## 💬 Social Media（微信社区交流群）

  <img src="https://docs.kweaver.ai/images/wx_qr_code.png" alt="Join the Group" height="350px"><br>
