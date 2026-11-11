# 蛋蛋不语 VIP 解锁 - Egern 模块

把 Loon 插件 [`curtinp118/Loon`](https://github.com/curtinp118/Loon) 的 `dandanvip.lpx` 移植到 Egern。
原脚本：`curtinp118/Scripthub` → `scripts/dandanvip/dandanvip_unlock.js` v1.1.0。

## 导入

Egern → 模块 → 添加模块订阅：

```text
https://raw.githubusercontent.com/bluee1111/egern-dandanvip/main/dandanvip.yaml
```

或直接下载 `dandanvip.yaml` 本地导入。

## 使用

1. 启用模块。
2. 启用并信任 Egern 的 MITM 证书（本模块只需解密 `38.76.202.248`）。
3. 打开蛋蛋不语 App，进入「我的」页面刷新一次即可。

## 设置

模块设置页可改两个参数：

- `VIP_NAME`：App 内显示的昵称，默认沿用上游作者值 `TG@Curtinp118`
- `VIP_AVATAR`：App 内显示的头像直链

## 原理

匹配 `^http://38\.76\.202\.248:8000/.*profiles.*` 的**响应体**，用原生 jq 合并 VIP 字段：

```jq
if type == "array" then
  map(. + {vip_status: true, vip_level: 3, vip_expire_at: "2099-09-19T22:21:06.147807+00:00", username: "...", avatar_url: "..."})
else
  . + {vip_status: true, vip_level: 3, vip_expire_at: "2099-09-19T22:21:06.147807+00:00", username: "...", avatar_url: "..."}
end
```

对象和数组两种返回结构都覆盖。原 JS 的三端适配层、Logger、远端脚本依赖已全部去掉 —— 本模块不下载、不执行任何远端脚本。

## 与上游的差异

| 项 | 上游 Loon 插件 | 本模块 |
|---|---|---|
| 实现 | 远端 JS（Scripthub） | Egern 原生 `response_jq` |
| 昵称/头像 | 硬编码在 JS 里 | `compat_arguments`，设置页可改 |
| `[Rule]` 段 12 个域名 | 未写策略，等于无效 | 抄成注释掉的可选 `rules:` 段，要直连可取消注释 |
| MITM 范围 | `38.76.202.248` | 同 |

## 边界

只改**客户端显示**的会员字段，服务端鉴权没有变。任何需要服务端校验 VIP 的功能（比如接口层的会员内容）仍然会被拒。

## 验证状态

- YAML 语法解析通过
- 匹配正则：命中 `http://38.76.202.248:8000/...profiles...`，不误伤 `https://` 与 `38.76.202.248` 的其他端口/相邻 IP
- jq 表达式在 object 与 array 两种结构上实跑输出正确（jq 1.7）
- 真机效果需在设备上开启 MITM 后验证
