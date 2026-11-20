# dsh-plugin-mcp-mvp-mes

MOM MES MCP 连接器，通过宿主内置的 `@deepseek-ai/dsh-mcp-client` 对接
`mom-mes-connector-t.hdt.cosmoplat.com`，并把 **API Key** 做成可在 Web UI 中直接修改的配置项。

## 与 0.1.x 的区别

0.1.x 只从进程环境变量读取密钥（`~/.dsh/.env` 或启动环境），改一次值要改文件、重启 DSH。
0.2.x 改为 **凭据引用（credential reference）**：

```yaml
headers:
  Authorization: 'Bearer ${credential:MOM_MES_API_KEY}'
expandTemplates: true
```

`${credential:…}` 由 Harness 的凭据库解析，而凭据库支持 `credentials.set()` 热更新：
值一变，`dsh-mcp-client` 就重新解析模板并**就地重建连接**，不需要重启。

## 配置入口

1. 左侧栏打开 **Plugins（插件）**
2. **Installed plugins** 里打开 **MOM MES connector**
3. 页面中间的 **连接配置** 表单里填 **API Key** —— 写入 `MOM_MES_API_KEY`
4. 点 **保存**；解析成功后，工具以 `mcp__mvpMes__<工具名>` 出现在智能体工具表中

表单显示的是「已配置 / 未配置」和掩码预览，**不会回显明文**；点 **清除** 会删除该引用。

## 值存放在哪里

| 优先级 | 位置 | 谁能写 |
|---|---|---|
| 1 | `~/.dsh/.credentials.yaml` 的 `refs:` 段 | 表单的 **保存 / 清除**（`credentials.set/unset`） |
| 2 | 启动时的进程环境变量 | 启动 DSH 的人 |
| 3 | 项目目录 `.env`，然后是 `~/.dsh/.env` | 手工编辑文件 |

保存过的值优先级最高，因此**旧的 `.env` 配置会被表单里的值覆盖**；想让环境变量重新生效，
用表单 **清除** 该引用即可。

凭据文件只有当前 OS 用户可读；但请注意智能体的工具进程也以同一用户运行，所以它不是隔离边界。

## 没有配置时

`expandTemplates` + 缺失引用会让这个 MCP 实例停在 `waiting-credentials`：不注册任何工具，
也不会消耗重连次数。填好值后立即恢复，无需重启。

## 参数说明

| 字段 | 说明 |
| --- | --- |
| `serverName` | `mvpMes`，决定工具名前缀 `mcp__mvpMes__` |
| `url` | MCP 端点，固定为 `https://mom-mes-connector-t.hdt.cosmoplat.com/mcp` |
| `expandTemplates` | 开启 `${credential:…}` 解析，并在诊断信息里把已解析的值替换为 `[redacted]` |
| `failOnStartupError` | `false`：初始连接失败不阻止 DSH 启动 |

请求头只有一项：`Authorization: Bearer <MOM_MES_API_KEY>`。

## 自测清单

- ✅ 表单写入 `MOM_MES_API_KEY` 后，`describe` 返回 `configured: true`
- ✅ 保存后连接重建，`mcp__mvpMes__work_order_page` 等工具出现
- ✅ 清除引用后回到 `waiting-credentials`，工具消失但不影响其它插件
- ✅ 诊断信息中不出现明文密钥

## License

MIT
