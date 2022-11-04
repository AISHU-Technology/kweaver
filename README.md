
![LOGO](./images/kw-logo.png)

KWeaver 是开源的认知智能开发框架，为数据科学家、应用开发者和领域专家提供具有**快速的开发**能力、全面的 **开放性** 和 **高性能** 的知识网络生成及认知智能应用开发的工具与平台。

## 快速入门

### 安装

KWeaver 项目基于云原生技术打造，项目提供了 docker compose 以及 install.sh 来实现安装。安装方式如下:

```bash
# git clone https://github.com/AISHU-Technology/kweaver.git
# cd kweaver/deploy
# ./install.sh

```

请根据提示完成安装，安装过程中会默认安装 Nginx 作为整个平台的入口。其余的依赖会在安装过程中提示，请按需选择，这些依赖包含:

- MariaDB：系统配置持久化
- MongoDB：中间数据存储
- Redis：全局缓存
