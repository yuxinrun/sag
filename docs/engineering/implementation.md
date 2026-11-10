---
title: 开源实现架构
description: Zleap-AI/SAG 的一个引擎三种入口、仓库分层、依赖规则与存储后端。
---

# 开源实现架构

论文讲的是方法，[官方仓库](https://github.com/Zleap-AI/SAG) 给的是一套能跑的产品。进阶工程师最该看的不是界面，而是它的**依赖边界**——这决定了你能不能只取其中一层嵌进自己的系统。

> **最重要的依赖规则（官方架构页原意）：应用通过一个适配层访问 `zleap-sag`；知识引擎不依赖 FastAPI、Web UI、用户、会话或引用。**

版本口径：官方文档标注 **v1.2.2，更新于 2026-07-22**，MIT 许可；本文按该版本描述，后续请以 main 分支为准。

## 一个引擎，三种入口

```text
产品前端 (Next.js 15 + React 19)  ─┐
自定义前端                        ├─→ SAG API (FastAPI) ─→ sag/ 适配层 ─→ zleap-sag 引擎
外部 Agent (MCP / OpenAI 兼容)   ─┘

Python 服务 ──────────────────────────────────────────────→ zleap-sag 引擎（绕过参考应用）
```

官方明确允许：替换 Web 或桌面界面而保留完整 API；在自己的 Python 服务里只使用引擎；独立演进 Agent 会话与知识检索；把用户、引用、任务和安全策略留在应用层。

## 仓库结构

按官方 wiki「系统架构」页：

```text
apps/
├── web/                    Next.js 15 + React 19 产品界面
├── desktop/                Electron 桌面封装与本地 sidecar
└── api/
    ├── sag_api/
    │   ├── api/v1/         FastAPI 路由与序列化
    │   ├── connectors/     文件/网页连接器与注册表
    │   ├── parsing/        MarkItDown 与 MinerU 规范化
    │   ├── jobs/           ingest -> extract 后台状态机
    │   ├── sag/            唯一导入 zleap-sag 的应用适配层
    │   ├── generation/     检索证据 -> 流式带引用回答
    │   ├── mcp/            MCP Server 与 HTTP 挂载
    │   ├── services/       应用与领域编排
    │   └── tools/          内置与远程 MCP Agent 工具
    └── sag_agent/          与框架无关的 Agent Runtime Core
skills/sag/                 Agent 知识探索 Skill
deploy/                     数据库初始化资源
docs/assets/readme/         产品截图与架构图
```

`apps/api/sag_api/sag/` 是**唯一**导入引擎的适配层，它把应用对象转换为引擎配置与 DTO。想换引擎或加一层缓存，改动应该集中在这里。

## 两条数据路径

**文档处理**

```text
connector -> parser -> document service -> background job
          -> sag adapter -> DataEngine.ingest / extract
          -> relational + vector storage
```

上传文件保留在应用数据目录；解析后的 Markdown、文档状态与任务属于应用层；chunk、event、entity 与检索索引由引擎管理。

**回答生成**

```text
Agent run -> retrieval service -> evidence sections
          -> generation LLM -> SSE output + citations
```

引用在应用层组装，但**引用目标来自引擎返回的原文 chunk**。官方特意强调这条边界，是为了让生成文本与证据边界不混进同一个不可解释的结果里。详见 [证据边界与引用](/architecture/evidence-boundary)。

## 桌面边界

Electron 打包同一套 Next.js 工作台，并在本机管理 Next.js standalone 运行时与 PyInstaller FastAPI sidecar。数据库、上传文件、索引与运行密钥写入系统 `userData` 目录，不写安装目录。Web、API 与 Python sidecar 使用**同一整包版本**发布，不能分别升级其中一部分。

## 存储后端

按官方 wiki「zleap-sag Python 引擎」页：

| 部署 | 关系型存储 | 向量存储 | extra |
| --- | --- | --- | --- |
| 本地默认 | SQLite | LanceDB | 无 |
| 单数据库 | PostgreSQL | pgvector | `zleap-sag[postgres]` |
| 生产拆分 | MySQL / PostgreSQL / OceanBase | Elasticsearch | `[mysql]`、`[postgres]`、`[es]` |
| OceanBase | OceanBase 4.3.3+ | OceanBase vector | `[mysql]` |

改变 `EngineConfig` 不需要改写 `ingest`、`extract`、`search` 调用。但官方提示：**当前连接是进程级全局资源，一个进程只应使用一份 `EngineConfig`**。

## 依赖边界带来的四个工程选择

| 你想做的事 | 应该落在哪一层 |
| --- | --- |
| 换 UI / 换桌面壳 | `apps/web`、`apps/desktop`，API 不动 |
| 只把检索嵌进自己的 Python 服务 | 直接 `pip install zleap-sag`，不引入 FastAPI |
| 自定义引用格式、权限、审计 | 应用层 `generation/` 与 `services/` |
| 换检索策略或存储 | `sag/` 适配层与 `EngineConfig` |

::: tip 一个容易被忽略的收益
因为引擎不管用户与会话，你的多租户、配额、审计都可以自由设计；但也正因如此，**租户隔离必须由应用层和数据库策略自己保证**，不能指望引擎替你做。见 [生产部署与安全](/engineering/production)。
:::

## 下一步

- 检索策略与预算 → [检索模式与预算](/engineering/retrieval-modes)
- 生产配置 → [生产部署与安全](/engineering/production)
- API 与引擎调用 → [API 与 Python 引擎](/integrations/api)
