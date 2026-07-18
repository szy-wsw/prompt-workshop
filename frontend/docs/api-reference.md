# Prompt Workshop API 接口文档

> **项目说明**：Next.js 16 App Router + TypeScript + Supabase 全栈项目「Prompt Workshop」后端 API 接口文档。
>
> **当前状态**：项目代码已推送 GitHub，本地功能全部实现并验证通过；唯一缺失为线上 Demo 链接（域名完成实名认证 + DNS 解析后补充完善）。
>
> **技术栈**：Next.js 16 App Router、TypeScript、Supabase（PostgreSQL + Storage）、自定义 JWT 认证、硅基流动 SiliconFlow `Qwen/Qwen2.5-7B-Instruct`。

---

## 目录

1. [API 概述](#1-api-概述)
2. [线上域名预留](#2-线上域名预留)
3. [认证接口](#3-认证接口)
   - 3.1 [用户注册 POST /api/signup](#31-用户注册-post-apisignup)
   - 3.2 [用户登录 POST /api/login](#32-用户登录-post-apilogin)
4. [用户接口](#4-用户接口)
   - 4.1 [更新资料 PUT /api/profile](#41-更新资料-put-apiprofile)
   - 4.2 [上传头像 POST /api/profile](#42-上传头像-post-apiprofile)
   - 4.3 [用户统计 GET /api/users/stats](#43-用户统计-get-apiusersstats)
   - 4.4 [用户排名 GET /api/users/ranking](#44-用户排名-get-apiusersranking)
5. [提示词接口](#5-提示词接口)
   - 5.1 [创建提示词 POST /api/prompts](#51-创建提示词-post-apiprompts)
   - 5.2 [提示词列表 GET /api/prompts](#52-提示词列表-get-apiprompts)
   - 5.3 [更新提示词 PUT /api/prompts/[id]](#53-更新提示词-put-apipromptsid)
   - 5.4 [删除提示词 DELETE /api/prompts/[id]](#54-删除提示词-delete-apipromptsid)
   - 5.5 [提示词历史 GET /api/prompts/[id]/history](#55-提示词历史-get-apipromptsidhistory)
6. [点赞接口](#6-点赞接口)
   - 6.1 [点赞 POST /api/likes](#61-点赞-post-apilikes)
   - 6.2 [取消点赞 DELETE /api/likes](#62-取消点赞-delete-apilikes)
   - 6.3 [检查点赞状态 GET /api/likes/check](#63-检查点赞状态-get-apilikescheck)
7. [收藏接口](#7-收藏接口)
   - 7.1 [收藏 POST /api/collections](#71-收藏-post-apicollections)
   - 7.2 [取消收藏 DELETE /api/collections](#72-取消收藏-delete-apicollections)
   - 7.3 [收藏列表 GET /api/collections](#73-收藏列表-get-apicollections)
   - 7.4 [检查收藏状态 GET /api/collections/check](#74-检查收藏状态-get-apicollectionscheck)
8. [AI 对话接口](#8-ai-对话接口)
   - 8.1 [流式对话 POST /api/chat](#81-流式对话-post-apichat)
   - 8.2 [对话历史 GET /api/chat-history](#82-对话历史-get-apichat-history)
9. [模板接口](#9-模板接口)
   - 9.1 [模板列表 GET /api/templates](#91-模板列表-get-apitemplates)
10. [错误码说明](#10-错误码说明)

---

## 1. API 概述

### 1.1 基础信息

| 项目 | 值 |
| --- | --- |
| 协议 | HTTP / HTTPS |
| 本地基础 URL | `http://localhost:3000/api` |
| 线上基础 URL | _域名完成实名认证 + DNS 解析后补充完善_ |
| 数据格式 | `application/json`（除头像上传使用 `multipart/form-data`、AI 对话返回 `text/event-stream` 外） |
| 字符编码 | UTF-8 |
| 运行时 | Next.js Runtime `nodejs` |

> **备注**：项目代码已推送 GitHub，本地功能全部实现并验证通过。线上基础 URL 待域名完成实名认证与 DNS 解析后补充完善。

### 1.2 认证方式

本系统采用**自定义 JWT（HS256）**认证方案，不依赖任何第三方云开发服务。

- **请求头格式**：
  ```
  Authorization: Bearer <access_token>
  ```
- **Token 组成**：`header.payload.signature`，使用 `HMAC-SHA256` 签名，密钥由环境变量 `JWT_SECRET` 配置。
- **Token 载荷**：包含 `userId`、`email`、`exp`（过期时间戳）。
- **有效期**：默认 `24h`（86400 秒），由 `/api/login` 接口签发。
- **校验流程**：服务端通过 `verifyAuth(req)` 解析 Authorization 头、验签、校验过期时间，失败时返回 `401`。

### 1.3 统一响应格式

所有 JSON 接口遵循统一结构：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | boolean | 请求是否成功，`true` 表示业务成功，`false` 表示业务失败 |
| `message` | string | 人类可读的提示信息（中文） |
| `data` | any \| null | 业务数据，失败时为 `null` |

### 1.4 跨域处理

所有路由均实现 `OPTIONS` 预检方法，返回 `204 No Content`，并附带以下响应头：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 1.5 通用约定

- 所有时间字段使用 ISO 8601 字符串（如 `2026-07-18T08:00:00.000Z`）。
- 数据持久化基于 Supabase（PostgreSQL）+ Supabase Storage。
- 所有数据库读写均通过服务端封装的辅助方法执行，使用 Supabase Admin 客户端。
- 密码采用 `pbkdf2Sync(password, salt, 100000, 64, 'sha512')` 加盐哈希存储，盐值为 16 字节随机 hex 字符串。

---

## 2. 线上域名预留

> **本章节为预留空白，待以下条件满足后补充完善**：
> 1. 域名完成 ICP 备案与实名认证
> 2. DNS 解析指向生产服务器
> 3. 生产环境部署完成并通过烟雾测试

- 生产基础 URL：________________________
- 生产 API 文档地址：________________________
- 生产健康检查地址：________________________

> **重申**：项目代码已推送 GitHub，本地功能全部实现并验证通过。当前唯一缺失内容仅为线上 Demo 链接。

---

## 3. 认证接口

### 3.1 用户注册 POST /api/signup

用于新用户注册账号。注册成功后需调用登录接口获取 Token。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `POST` |
| 路径 | `/api/signup` |
| 是否需要认证 | 否 |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `nickname` | string | 是 | 用户昵称，至少 2 个字符 |
| `email` | string | 是 | 邮箱地址，需包含 `@` 与 `.` |
| `password` | string | 是 | 登录密码，至少 6 位 |

**请求示例**

```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "张三",
    "email": "zhangsan@example.com",
    "password": "123456"
  }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "注册成功，请登录",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `昵称至少2个字符` | nickname 长度不足 |
| 400 | `邮箱格式不正确` | email 不符合格式要求 |
| 400 | `密码至少6位` | password 长度不足 |
| 400 | `该邮箱已注册，请直接登录` | email 已存在 |
| 400 | `数据库查询失败: ...` | 数据库查询异常 |
| 400 | `数据库写入失败: ...` | 数据库写入异常 |
| 400 | `注册失败: <错误信息>` | 其他未知异常 |

---

### 3.2 用户登录 POST /api/login

使用邮箱密码登录，成功后签发 JWT Token。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `POST` |
| 路径 | `/api/login` |
| 是否需要认证 | 否 |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `email` | string | 是 | 注册时的邮箱 |
| `password` | string | 是 | 注册时的密码 |

**请求示例**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zhangsan@example.com",
    "password": "123456"
  }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user-uuid-001",
      "email": "zhangsan@example.com",
      "nickname": "张三",
      "avatar_url": ""
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXV1aWQtMDAxIiwiZW1haWwiOiJ6aGFuZ3NhbkBleGFtcGxlLmNvbSIsImV4cCI6MTc1Mjk0NTYwMH0.signature",
      "refresh_token": "",
      "expires_at": 1752945600
    }
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `请输入邮箱` | email 为空 |
| 400 | `请输入密码` | password 为空 |
| 400 | `邮箱或密码错误` | 邮箱不存在或密码不匹配 |
| 400 | `登录失败: <错误信息>` | 其他未知异常 |

---

## 4. 用户接口

### 4.1 更新资料 PUT /api/profile

更新当前登录用户的昵称或密码。两种操作互斥，单次请求只能执行其中一种。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `PUT` |
| 路径 | `/api/profile` |
| 是否需要认证 | 是 |

**请求 Body 参数（JSON）**

更新昵称：

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `nickname` | string | 是 | 新昵称 |

修改密码：

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `old_password` | string | 是 | 当前密码 |
| `new_password` | string | 是 | 新密码，至少 6 位 |

**请求示例 - 更新昵称**

```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{ "nickname": "新昵称" }'
```

**请求示例 - 修改密码**

```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "old_password": "123456",
    "new_password": "654321"
  }'
```

**成功响应示例 - 更新昵称（200）**

```json
{
  "success": true,
  "message": "昵称更新成功",
  "data": {
    "id": "user-uuid-001",
    "email": "zhangsan@example.com",
    "nickname": "新昵称",
    "avatar_url": "https://.../avatar.png"
  }
}
```

**成功响应示例 - 修改密码（200）**

```json
{
  "success": true,
  "message": "密码更新成功",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `无更新内容` | 请求体未提供 nickname 或 old_password + new_password |
| 400 | `用户不存在` | userId 在 users 表中查不到 |
| 400 | `当前密码不正确` | old_password 与数据库哈希不匹配 |
| 400 | `新密码至少6位` | new_password 长度不足 |
| 401 | `请先登录` | 缺少 Authorization 头 |
| 401 | `登录已过期，请重新登录` | Token 无效或已过期 |

---

### 4.2 上传头像 POST /api/profile

上传或替换当前用户的头像图片。新头像会覆盖旧头像（旧文件会从对象存储中删除）。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `POST` |
| 路径 | `/api/profile` |
| 是否需要认证 | 是 |
| Content-Type | `multipart/form-data` |

**请求 Body 参数（form-data）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `avatar` | File | 是 | 图片文件，支持 `jpg` / `jpeg` / `png` / `webp`，大小 ≤ 2MB |

**请求示例**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Authorization: Bearer <access_token>" \
  -F "avatar=@/path/to/avatar.png"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "头像上传成功",
  "data": {
    "avatar_url": "https://<supabase-storage-host>/avatars/user-uuid-001/1752945600000.png"
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `未选择文件` | form-data 中未包含 avatar |
| 400 | `仅支持 JPG/PNG/WebP 格式图片` | MIME 类型不在白名单 |
| 400 | `图片大小不能超过 2MB` | 文件大小 > 2MB |
| 400 | `文件扩展名不支持，仅支持 jpg/png/webp` | 扩展名不在白名单 |
| 400 | `头像上传失败: <错误信息>` | 上传过程异常 |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

**特殊说明**：旧头像若存在（`avatar_path` 字段非空），上传成功后会异步删除旧文件，删除失败仅打印日志不影响主流程。

---

### 4.3 用户统计 GET /api/users/stats

获取用户维度的统计数据，支持站点总览与个人统计两种模式。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/users/stats` |
| 是否需要认证 | 视模式而定（见下文） |

**请求 Query 参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 否 | 取值 `site` 时返回站点总览统计，此时无需认证 |
| `user_id` | string | 否 | 当未传 `type=site` 时，可指定目标用户 ID 查询其统计；不传则使用当前登录用户 ID |

**请求示例 - 站点总览（无需登录）**

```bash
curl "http://localhost:3000/api/users/stats?type=site"
```

**请求示例 - 个人统计**

```bash
curl "http://localhost:3000/api/users/stats" \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例 - 站点总览（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "totalPrompts": 128,
    "totalUsers": 36,
    "publicPrompts": 84,
    "totalChats": 0
  }
}
```

**成功响应示例 - 个人统计（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "totalPrompts": 12,
    "publicPrompts": 8,
    "totalCollections": 5
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 401 | `请先登录` | 未传 `type=site` 且未携带 Authorization 头（接口会降级返回零值，不抛错） |

**特殊说明**：当未传 `type=site` 且未携带 Token 时，接口不会报错，而是直接返回零值统计，便于公开页面降级展示。

---

### 4.4 用户排名 GET /api/users/ranking

返回最近注册的用户列表（按 `created_at` 倒序），用于"新用户排行榜"展示。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/users/ranking` |
| 是否需要认证 | 否 |

**请求 Query 参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `limit` | number | 否 | 返回条数，默认 `10` |

**请求示例**

```bash
curl "http://localhost:3000/api/users/ranking?limit=10"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": "user-uuid-036",
      "nickname": "李四",
      "email": "lisi@example.com",
      "avatar_url": "https://.../avatar.png",
      "created_at": "2026-07-17T10:20:30.000Z"
    },
    {
      "id": "user-uuid-035",
      "nickname": "王五",
      "email": "wangwu@example.com",
      "avatar_url": "",
      "created_at": "2026-07-16T08:15:00.000Z"
    }
  ]
}
```

**特殊说明**：为防止排名并列，内部会拉取 `limit * 2` 条数据后截取前 `limit` 条返回。

---

## 5. 提示词接口

### 5.1 创建提示词 POST /api/prompts

创建一条新的提示词，同时写入 `prompt_history` 表作为首版历史记录。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `POST` |
| 路径 | `/api/prompts` |
| 是否需要认证 | 是 |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `title` | string | 是 | 提示词标题 |
| `content` | string | 是 | 提示词正文 |
| `tags` | string[] | 否 | 标签数组，默认 `[]` |
| `visibility` | string | 否 | 可见性，`public` / `private`，默认 `private` |

**请求示例**

```bash
curl -X POST http://localhost:3000/api/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "title": "代码评审助手",
    "content": "请评审以下代码并指出问题：\n\n{{code}}",
    "tags": ["编程", "代码评审"],
    "visibility": "public"
  }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": "prompt-uuid-001",
    "title": "代码评审助手",
    "content": "请评审以下代码并指出问题：\n\n{{code}}",
    "tags": ["编程", "代码评审"],
    "visibility": "public",
    "author_id": "user-uuid-001",
    "likes_count": 0,
    "created_at": "2026-07-18T03:00:00.000Z",
    "updated_at": "2026-07-18T03:00:00.000Z"
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `创建失败: <错误信息>` | 数据库写入异常 |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

---

### 5.2 提示词列表 GET /api/prompts

获取提示词列表，支持按用户、可见性、关键词、标签筛选与分页。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/prompts` |
| 是否需要认证 | 视查询条件而定（见下文） |

**请求 Query 参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `user_id` | string | 否 | 指定作者 ID。仅查自己所有提示词时需带 Token |
| `visibility` | string | 否 | 可见性过滤，`public` / `private` |
| `search` | string | 否 | 关键词，对 `title` 与 `content` 进行 `ilike` 模糊匹配 |
| `tag` | string | 否 | 标签筛选，对 `tags` 数组使用 `contains` 匹配 |
| `prompt_id` | string | 否 | 指定提示词 ID 精确查询（优先级最高） |
| `page` | number | 否 | 页码，默认 `1` |
| `per_page` | number | 否 | 每页条数，默认 `50` |

**查询规则**

- 若传 `prompt_id`：仅按 ID 精确查询，忽略其余条件。
- 若同时传 `user_id` 与 `visibility`：按这两个字段精确匹配。
- 若仅传 `user_id`：
  - 若 `user_id` 等于当前登录用户 ID，返回该用户全部提示词（含 private）。
  - 若 `user_id` 不等于当前登录用户 ID，仅返回该用户的 `public` 提示词。
- 若仅传 `visibility`：按该可见性过滤。
- 都不传：默认只返回 `visibility=public` 的提示词。
- `user_id` 等于当前登录用户但未带 Token 时返回 `401`。

**请求示例**

```bash
# 公开广场
curl "http://localhost:3000/api/prompts?page=1&per_page=20&search=代码"

# 我自己的全部
curl "http://localhost:3000/api/prompts?user_id=user-uuid-001" \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "data": [
      {
        "id": "prompt-uuid-001",
        "title": "代码评审助手",
        "content": "请评审以下代码并指出问题：\n\n{{code}}",
        "tags": ["编程", "代码评审"],
        "visibility": "public",
        "author_id": "user-uuid-001",
        "likes_count": 5,
        "created_at": "2026-07-18T03:00:00.000Z",
        "updated_at": "2026-07-18T03:00:00.000Z",
        "profiles": {
          "nickname": "张三",
          "avatar_url": "https://.../avatar.png",
          "email": "zhangsan@example.com"
        }
      }
    ],
    "total": 84
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 401 | `请先登录` / `登录已过期，请重新登录` | 仅传 `user_id` 且为当前登录用户但未携带 Token |

**特殊说明**：每条记录会附带 `profiles` 字段，包含作者昵称、头像、邮箱；查不到作者时返回 `{ nickname: "未知用户", avatar_url: "" }`。

---

### 5.3 更新提示词 PUT /api/prompts/[id]

更新指定提示词的内容，同时写入一条新的 `prompt_history` 历史记录。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `PUT` |
| 路径 | `/api/prompts/[id]` |
| 是否需要认证 | 是 |
| 权限要求 | 仅作者本人可更新 |

**路径参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 提示词 ID |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `title` | string | 是 | 新标题 |
| `content` | string | 是 | 新正文 |
| `tags` | string[] | 是 | 新标签数组 |
| `visibility` | string | 是 | 新可见性，`public` / `private` |

**请求示例**

```bash
curl -X PUT http://localhost:3000/api/prompts/prompt-uuid-001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "title": "代码评审助手 v2",
    "content": "请评审以下代码并给出改进建议：\n\n{{code}}",
    "tags": ["编程", "代码评审", "改进"],
    "visibility": "public"
  }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "更新成功",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |
| 403 | `无权限修改` | 当前用户非提示词作者 |
| 404 | `提示词不存在` | 路径 id 在数据库中查不到 |

---

### 5.4 删除提示词 DELETE /api/prompts/[id]

删除指定提示词，同时级联删除其全部历史记录、点赞记录、收藏记录。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `DELETE` |
| 路径 | `/api/prompts/[id]` |
| 是否需要认证 | 是 |
| 权限要求 | 仅作者本人可删除 |

**路径参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 提示词 ID |

**请求示例**

```bash
curl -X DELETE http://localhost:3000/api/prompts/prompt-uuid-001 \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "删除成功",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |
| 403 | `无权限删除` | 当前用户非提示词作者 |
| 404 | `提示词不存在` | 路径 id 在数据库中查不到 |

**特殊说明**：删除操作会顺序清理 `prompt_history` → `likes` → `collections` → `prompts` 四张表中与该提示词关联的所有记录。

---

### 5.5 提示词历史 GET /api/prompts/[id]/history

获取指定提示词的全部历史版本记录（仅作者本人可查看）。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/prompts/[id]/history` |
| 是否需要认证 | 是 |
| 权限要求 | 仅作者本人可查看 |

**路径参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 提示词 ID |

**请求示例**

```bash
curl "http://localhost:3000/api/prompts/prompt-uuid-001/history" \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": "history-uuid-002",
      "prompt_id": "prompt-uuid-001",
      "title": "代码评审助手 v2",
      "content": "请评审以下代码并给出改进建议：\n\n{{code}}",
      "tags": ["编程", "代码评审", "改进"],
      "visibility": "public",
      "edited_by": "user-uuid-001",
      "created_at": "2026-07-18T05:00:00.000Z"
    },
    {
      "id": "history-uuid-001",
      "prompt_id": "prompt-uuid-001",
      "title": "代码评审助手",
      "content": "请评审以下代码并指出问题：\n\n{{code}}",
      "tags": ["编程", "代码评审"],
      "visibility": "public",
      "edited_by": "user-uuid-001",
      "created_at": "2026-07-18T03:00:00.000Z"
    }
  ]
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |
| 403 | `无权限查看` | 当前用户非提示词作者 |
| 404 | `提示词不存在` | 路径 id 在数据库中查不到 |

**特殊说明**：历史记录按 `created_at` 倒序返回，最新版本在前。

---

## 6. 点赞接口

### 6.1 点赞 POST /api/likes

为指定提示词点赞。同一用户对同一提示词仅能点赞一次。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `POST` |
| 路径 | `/api/likes` |
| 是否需要认证 | 是 |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `prompt_id` | string | 是 | 被点赞的提示词 ID |

**请求示例**

```bash
curl -X POST http://localhost:3000/api/likes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{ "prompt_id": "prompt-uuid-001" }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "点赞成功",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `缺少prompt_id` | 未传 prompt_id |
| 400 | `您已经点赞过啦` | 重复点赞 |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

**特殊说明**：点赞成功后会同步对 `prompts` 表对应记录的 `likes_count` 字段 +1。

---

### 6.2 取消点赞 DELETE /api/likes

取消对指定提示词的点赞。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `DELETE` |
| 路径 | `/api/likes` |
| 是否需要认证 | 是 |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `prompt_id` | string | 是 | 取消点赞的提示词 ID |

**请求示例**

```bash
curl -X DELETE http://localhost:3000/api/likes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{ "prompt_id": "prompt-uuid-001" }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "取消点赞成功",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `缺少prompt_id` | 未传 prompt_id |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

**特殊说明**：即使未点赞过，调用此接口也会返回成功；若提示词存在且 `likes_count > 0`，则同步 -1。

---

### 6.3 检查点赞状态 GET /api/likes/check

查询当前用户是否已对指定提示词点赞。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/likes/check` |
| 是否需要认证 | 是 |

**请求 Query 参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `prompt_id` | string | 是 | 提示词 ID |

**请求示例**

```bash
curl "http://localhost:3000/api/likes/check?prompt_id=prompt-uuid-001" \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "liked": true
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `缺少prompt_id` | 未传 prompt_id |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

---

## 7. 收藏接口

### 7.1 收藏 POST /api/collections

收藏指定提示词。同一用户对同一提示词仅能收藏一次。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `POST` |
| 路径 | `/api/collections` |
| 是否需要认证 | 是 |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `prompt_id` | string | 是 | 被收藏的提示词 ID |

**请求示例**

```bash
curl -X POST http://localhost:3000/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{ "prompt_id": "prompt-uuid-001" }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "收藏成功",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `缺少prompt_id` | 未传 prompt_id |
| 400 | `您已经收藏过啦` | 重复收藏 |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

---

### 7.2 取消收藏 DELETE /api/collections

取消对指定提示词的收藏。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `DELETE` |
| 路径 | `/api/collections` |
| 是否需要认证 | 是 |

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `prompt_id` | string | 是 | 取消收藏的提示词 ID |

**请求示例**

```bash
curl -X DELETE http://localhost:3000/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{ "prompt_id": "prompt-uuid-001" }'
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "取消收藏成功",
  "data": null
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `缺少prompt_id` | 未传 prompt_id |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

**特殊说明**：即使未收藏过，调用此接口也会返回成功（幂等）。

---

### 7.3 收藏列表 GET /api/collections

获取当前登录用户的收藏列表，按收藏时间倒序返回，并附带提示词详情。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/collections` |
| 是否需要认证 | 是 |

**请求 Query 参数**

无

**请求示例**

```bash
curl "http://localhost:3000/api/collections" \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "data": [
      {
        "id": "collection-uuid-001",
        "prompt_id": "prompt-uuid-001",
        "user_id": "user-uuid-001",
        "created_at": "2026-07-18T04:00:00.000Z",
        "prompts": {
          "id": "prompt-uuid-001",
          "title": "代码评审助手",
          "content": "请评审以下代码并指出问题：\n\n{{code}}",
          "tags": ["编程", "代码评审"],
          "visibility": "public",
          "author_id": "user-uuid-002",
          "likes_count": 5
        }
      }
    ],
    "total": 1
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

**特殊说明**：仅会返回对应提示词 `visibility=public` 的收藏记录；若提示词被改为 private 或已删除，则该收藏项不会出现在列表中。

---

### 7.4 检查收藏状态 GET /api/collections/check

查询当前用户是否已收藏指定提示词。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/collections/check` |
| 是否需要认证 | 是 |

**请求 Query 参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `prompt_id` | string | 是 | 提示词 ID |

**请求示例**

```bash
curl "http://localhost:3000/api/collections/check?prompt_id=prompt-uuid-001" \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "collected": true
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `缺少prompt_id` | 未传 prompt_id |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

---

## 8. AI 对话接口

### 8.1 流式对话 POST /api/chat

基于硅基流动 SiliconFlow `Qwen/Qwen2.5-7B-Instruct` 模型，返回 **Server-Sent Events (SSE) 流式响应**。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `POST` |
| 路径 | `/api/chat` |
| 是否需要认证 | 是 |
| 响应 Content-Type | `text/event-stream` |

**限流策略**

- 每个 userId 在 60 秒窗口内最多调用 **8 次**。
- 超出限流返回 `429`，message 中提示剩余冷却秒数。

**请求 Body 参数（JSON）**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `messages` | array<{role, content}> | 否 | OpenAI 格式消息数组；为空时会回落使用 `prompt` |
| `prompt` | string | 否 | 当 `messages` 为空时使用，会自动包装为 `[{role: "user", content: prompt}]` |
| `conversation_id` | string \| null | 否 | 会话 ID，仅作为历史记录的关联字段保存 |
| `save_history` | boolean | 否 | 是否将本次对话存入 `chat_history` 表，默认 `true` |

> `messages` 与 `prompt` 至少传其一；若 `messages` 非空则忽略 `prompt`。

**请求示例**

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "messages": [
      { "role": "system", "content": "你是一位友好的助手" },
      { "role": "user", "content": "用三句话介绍 Next.js" }
    ],
    "conversation_id": "conv-001",
    "save_history": true
  }'
```

**响应说明（SSE 流）**

响应头：

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

每行以 `data: ` 前缀的 JSON 字符串形式推送，常见事件：

```
data: {"response":"Next","done":false}

data: {"response":".js","done":false}

data: {"response":" 是","done":false}

data: {"response":"","done":true}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `response` | string | 本次增量内容；结束时为空字符串 |
| `done` | boolean | 是否结束（含正常结束、上游 `[DONE]`、`finish_reason` 触发） |
| `error` | string | 仅在流处理过程中异常时出现，与 `done: true` 同时返回 |

**上游模型参数**

| 参数 | 值 |
| --- | --- |
| `model` | `Qwen/Qwen2.5-7B-Instruct`（可由环境变量 `FREE_MODEL_ID` 覆盖） |
| `stream` | `true` |
| `max_tokens` | `2048` |
| `temperature` | `0.7` |

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 400 | `请输入内容` | messages 与 prompt 均为空 |
| 400 | `AI对话失败: <错误信息>` | 流处理前置异常 |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |
| 429 | `请求过于频繁，请<N>秒后再试` | 触发本地限流（每用户 60 秒 8 次） |
| 429 | `AI访问繁忙，请稍后重试` | 上游 SiliconFlow 返回 429 |
| 502 | `AI服务异常(<状态码>)` | 上游 SiliconFlow 返回非 200/429 |
| 503 | `AI服务未配置，请联系管理员设置 SILICONFLOW_API_KEY` | 服务端未配置 API Key |

**特殊说明**

1. **流式响应**：本接口是项目内唯一返回 `text/event-stream` 的接口，客户端需使用 SSE 解析方式消费。
2. **历史保存**：流结束后，若 `save_history !== false` 且 `fullResponse` 非空，则异步写入 `chat_history` 表，保存失败仅打印日志不影响响应。
3. **流中异常**：流处理过程中出现异常会以 `data: {"error":"...","done":true}` 推送后关闭流。

---

### 8.2 对话历史 GET /api/chat-history

获取当前登录用户的 AI 对话历史列表，按时间倒序分页返回。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/chat-history` |
| 是否需要认证 | 是 |

**请求 Query 参数**

| 参数名 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `page` | number | 否 | 页码，默认 `1` |
| `per_page` | number | 否 | 每页条数，默认 `20` |

**请求示例**

```bash
curl "http://localhost:3000/api/chat-history?page=1&per_page=20" \
  -H "Authorization: Bearer <access_token>"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "data": [
      {
        "id": "history-uuid-001",
        "user_id": "user-uuid-001",
        "conversation_id": "conv-001",
        "user_message": "用三句话介绍 Next.js",
        "ai_response": "Next.js 是一个基于 React 的全栈框架...",
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "created_at": "2026-07-18T06:00:00.000Z"
      }
    ],
    "total": 36
  }
}
```

**错误响应**

| HTTP 状态码 | message 示例 | 触发条件 |
| --- | --- | --- |
| 401 | `请先登录` / `登录已过期，请重新登录` | 认证失败 |

---

## 9. 模板接口

### 9.1 模板列表 GET /api/templates

返回内置的提示词模板列表。模板为硬编码数据，不依赖数据库，无需认证。

| 项目 | 值 |
| --- | --- |
| 请求方式 | `GET` |
| 路径 | `/api/templates` |
| 是否需要认证 | 否 |

**请求 Query 参数**

无

**请求示例**

```bash
curl "http://localhost:3000/api/templates"
```

**成功响应示例（200）**

```json
{
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": "1",
      "title": "写作助手",
      "content": "你是一位专业的写作助手，请帮我完善以下内容。要求语言流畅、逻辑清晰、用词准确：\n\n{{内容}}",
      "tags": ["写作", "创意", "文章"],
      "category": "写作",
      "description": "帮助你优化和完善写作内容"
    },
    {
      "id": "2",
      "title": "代码生成",
      "content": "请帮我编写一个{{语言}}函数，功能是：{{功能描述}}。要求代码规范、有注释、包含错误处理。",
      "tags": ["编程", "代码", "开发"],
      "category": "编程",
      "description": "快速生成各类编程语言代码"
    }
  ]
}
```

**特殊说明**：当前内置 8 个模板（写作助手、代码生成、翻译助手、头脑风暴、问题分析、邮件模板、面试准备、故事创作），分别覆盖写作、编程、翻译、创意、分析、商务、职业、创作等场景。模板内容中 `{{占位符}}` 部分由前端在使用时替换。

---

## 10. 错误码说明

### 10.1 HTTP 状态码总览

| 状态码 | 含义 | 出现的接口 | 说明 |
| --- | --- | --- | --- |
| 200 | OK | 所有接口 | 业务成功 |
| 204 | No Content | 所有接口的 `OPTIONS` 预检 | CORS 预检成功 |
| 400 | Bad Request | 多数接口 | 参数校验失败、业务冲突（如重复点赞/收藏）、数据库异常 |
| 401 | Unauthorized | 所有需认证接口 | 缺少 Authorization 头、Token 无效或已过期 |
| 403 | Forbidden | `/api/prompts/[id]` PUT/DELETE、`/api/prompts/[id]/history` GET | 已认证但无权操作他人资源 |
| 404 | Not Found | `/api/prompts/[id]` PUT/DELETE、`/api/prompts/[id]/history` GET | 目标提示词不存在 |
| 429 | Too Many Requests | `/api/chat` | 本地限流（每用户 60 秒 8 次）或上游 AI 服务限流 |
| 500 | Internal Server Error | - | 当前实现未显式抛出，由 Next.js 兜底 |
| 502 | Bad Gateway | `/api/chat` | 上游 SiliconFlow 服务返回非 200/429 状态 |
| 503 | Service Unavailable | `/api/chat` | 服务端未配置 `SILICONFLOW_API_KEY` 环境变量 |

### 10.2 统一错误响应体

所有错误响应均遵循统一格式：

```json
{
  "success": false,
  "message": "<人类可读的中文错误描述>",
  "data": null
}
```

### 10.3 鉴权错误码细则

| 触发条件 | message |
| --- | --- |
| 未携带 Authorization 头 | `请先登录` |
| Token 签名错误、载荷解析失败、过期 | `登录已过期，请重新登录` |

### 10.4 限流错误码细则（仅 `/api/chat`）

| 触发条件 | HTTP 状态码 | message |
| --- | --- | --- |
| 本地限流命中（>8 次/60 秒） | 429 | `请求过于频繁，请<N>秒后再试` |
| 上游 SiliconFlow 限流 | 429 | `AI访问繁忙，请稍后重试` |
| 上游 SiliconFlow 非 200/429 | 502 | `AI服务异常(<状态码>)` |
| 未配置 `SILICONFLOW_API_KEY` | 503 | `AI服务未配置，请联系管理员设置 SILICONFLOW_API_KEY` |

---

## 附录 A. 环境变量

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| `JWT_SECRET` | 是 | JWT 签名密钥（HS256），生产环境务必使用强随机值 |
| `SILICONFLOW_API_KEY` | 是 | 硅基流动 API Key，未配置时 `/api/chat` 返回 503 |
| `FREE_MODEL_ID` | 否 | 默认 `Qwen/Qwen2.5-7B-Instruct`，可覆盖 |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL（客户端使用） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | Supabase 匿名 Key（客户端使用） |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | Supabase Service Role Key（服务端 Admin 客户端使用） |

---

## 附录 B. 文档维护说明

> **当前状态再次声明**：
> - 项目代码已推送 GitHub，本地功能全部实现并验证通过。
> - 当前唯一缺失内容为线上 Demo 链接。
> - 待「域名完成实名认证 + DNS 解析」后，将补充以下内容：
>   - 第 2 章「线上域名预留」章节的实际生产基础 URL。
>   - 第 1.1 节「基础信息」表格中的线上基础 URL。
>   - 生产环境的 CORS、HTTPS 证书、CDN 等部署细节。

> **文档约束**：
> - 本项目全程不使用任何 TCB / CloudBase / 云开发相关服务，所有数据持久化与对象存储均由 Supabase 提供。
> - 本文档不会出现上述云开发相关字样，如发现请视为笔误并修正。
