# dsh-plugin-mcp-mvp-mes

MOM MES MCP Connector for DeepSeek Harness (DSH)

## 简介

这是一个 Streamable HTTP 类型 MCP 连接器，对接 MOM MES 制造执行系统。
DSH 安装插件后，配置 API Key 和后端地址，即可调用 MES 相关工具，用于工单查询、设备状态、生产记录等业务操作。

> 本插件仅为 DSH 配置桥接包，**不包含 MES 后端服务**，依赖独立部署的 MCP 服务。

## MCP 信息

- Transport: `streamable-http`
- Endpoint: `https://mom-mes-connector-t.hdt.cosmoplat.com/mcp`

## 安装

```bash
# Web 配置文件
dsh plugin --profile web add dsh-plugin-mcp-mvp-mes

# Desktop 配置文件
dsh plugin --profile desktop add dsh-plugin-mcp-mvp-mes
```

## 使用说明

1. 安装插件
2. 打开插件配置面板，填写两项参数：
    - `apiKey`：Bearer 认证密钥
    - `xApiBaseUrl`：MES 后端基础地址，示例：`https://mom-dev.hdt.cosmoplat.com`
3. 保存配置，DSH 自动连接 MCP 服务，加载可用工具列表

## 参数说明

- `apiKey`：用于 `Authorization: Bearer` 鉴权
- `xApiBaseUrl`：请求头 `x-api-base-url`，用于后端路由转发

## 自测清单

- ✅ 本地 tgz 包安装成功
- ✅ 配置表单正常渲染，必填项校验生效
- ✅ 可正常调用 `tools/list` 获取工具
- ✅ Header 注入逻辑正确：`Authorization`、`x-api-base-url`
- ✅ 无硬编码密钥，凭据由用户自行维护

## License

MIT
