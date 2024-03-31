
![LOGO](./images/kw-logo.png)

KWeaver 是开源的认知智能开发框架，为数据科学家、应用开发者和领域专家提供具有**快速的开发**能力、全面的 **开放性** 和 **高性能** 的知识网络生成及认知智能大模型框架。

## 快速入门

### 安装

KWeaver 项目基于云原生技术打造，项目提供了 docker-compose 来启动。启动方式如下:

```bash
 git clone https://github.com/AISHU-Technology/kweaver.git
 cd kweaver/docker
 docker-compose up -d
```
``` 初始化
初始化mysql数据库脚本: mysql_init.sql
外接向量模型: 添加kw-builder环境变量VECTOR_URL向量模型地址，在图谱构建时添加大模型向量检索的索引。
```
```访问地址
本地访问地址： http://localhost:3001
演示地址： http://10.4.10.3:3001
```

依赖中间建
- MysqlDB：系统配置持久化
- MongoDB：中间数据存储
- Redis：全局缓存
- OpenSearch: 知识图谱搜索和向量存储
- Nebula: 图数据存储
- Nginx: 反向代理和负载均衡

