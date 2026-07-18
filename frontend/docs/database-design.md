# Prompt Workshop 数据库设计文档

> **项目状态说明**
> - 项目代码已推送 GitHub 公开仓库，本地 `localhost:3000` 所有功能已完整实现并自测通过。
> - 唯一缺失项为线上 Demo 访问链接（自定义域名 `szy050604.top` 未完成实名认证 + DNS 解析，暂无法线上部署）。
> - 本文档涉及的数据库结构、索引、RLS 策略、Storage 权限均已在本地 Supabase 项目中配置生效。

---

## 1. 数据库概述

### 1.1 技术选型

| 项目       | 说明                                                |
| ---------- | --------------------------------------------------- |
| 数据库类型 | Supabase 托管 PostgreSQL                            |
| 扩展依赖   | `pgcrypto`（提供 `gen_random_uuid()` 生成 UUID）    |
| Schema     | `public`（业务数据表）、`storage`（Storage 存储桶） |
| 表数量     | 7 张业务表 + 1 个 Storage 存储桶（avatars）         |
| 主键策略   | 全表统一使用 UUID（`uuid` 类型，`gen_random_uuid()` 默认值） |
| 时间字段   | 统一使用 `timestamptz`（带时区时间戳）              |

### 1.2 数据表清单

| 序号 | 表名             | 中文名       | 说明                                       |
| ---- | ---------------- | ------------ | ------------------------------------------ |
| 1    | `users`          | 用户表       | 存储账号、密码（加盐哈希）、昵称、头像信息 |
| 2    | `prompts`        | 提示词表     | 用户创建的提示词，支持公开/私有、标签      |
| 3    | `prompt_history` | 提示词历史表 | 提示词编辑历史快照，用于版本追溯           |
| 4    | `likes`          | 点赞表       | 用户对提示词的点赞记录                     |
| 5    | `collections`    | 收藏表       | 用户对提示词的收藏记录                     |
| 6    | `chat_history`   | 聊天历史表   | 用户与 AI 的对话记录                       |
| 7    | `templates`      | 模板表       | 系统预置的提示词模板                       |

### 1.3 认证与安全模式

- 本项目 **未使用 Supabase Auth**，而是采用 **自定义 JWT 认证**（基于 `JWT_SECRET` 签发/校验 Token）。
- 后端 API 通过 **`service_role` key** 访问 Supabase，**绕过 RLS**，所有数据访问权限由应用层（API 路由）控制。
- **RLS 作为安全兜底**：即使 `anon key` 意外暴露，由于 RLS 已启用并配置了限制策略，也无法读取到他人私有数据。
- 密码存储：明文密码 + 盐值（`salt`）在应用层做哈希处理后存入 `users.password` 字段。

---

## 2. 数据表字段说明

### 2.1 users（用户表）

存储平台所有注册用户的核心账号信息。

| 字段         | 类型          | 约束                    | 默认值             | 说明                            |
| ------------ | ------------- | ----------------------- | ------------------ | ------------------------------- |
| `id`         | `uuid`        | PRIMARY KEY             | `gen_random_uuid()`| 用户唯一标识                    |
| `email`      | `text`        | UNIQUE NOT NULL         | -                  | 登录邮箱，全局唯一              |
| `password`   | `text`        | NOT NULL                | -                  | 加盐哈希后的密码（非明文）      |
| `salt`       | `text`        | NOT NULL                | -                  | 密码盐值，用于哈希校验          |
| `nickname`   | `text`        | NOT NULL                | -                  | 用户昵称，展示用                |
| `avatar_url` | `text`        | -                       | `''`               | 头像公开访问 URL（Storage 公开）|
| `avatar_path`| `text`        | -                       | `''`               | 头像在 Storage 中的对象路径     |
| `avatar`     | `text`        | -                       | `''`               | 头像原始文件名（兼容字段）      |
| `created_at` | `timestamptz` | -                       | `now()`            | 注册时间                        |
| `updated_at` | `timestamptz` | -                       | `now()`            | 信息最后更新时间                |

### 2.2 prompts（提示词表）

用户创建的提示词主表。

| 字段          | 类型          | 约束                                | 默认值             | 说明                                  |
| ------------- | ------------- | ----------------------------------- | ------------------ | ------------------------------------- |
| `id`          | `uuid`        | PRIMARY KEY                         | `gen_random_uuid()`| 提示词唯一标识                        |
| `title`       | `text`        | NOT NULL                            | -                  | 提示词标题                            |
| `content`     | `text`        | NOT NULL                            | -                  | 提示词正文内容                        |
| `tags`        | `text[]`      | -                                   | `'{}'`             | 标签数组，支持多标签                  |
| `visibility`  | `text`        | -                                   | `'private'`        | 可见性：`private`（私有）/ `public`（公开） |
| `author_id`   | `uuid`        | NOT NULL, FK → users(id) CASCADE    | -                  | 作者用户 ID                           |
| `likes_count` | `int`         | -                                   | `0`                | 点赞数（冗余计数，提升查询性能）      |
| `created_at`  | `timestamptz` | -                                   | `now()`            | 创建时间                              |
| `updated_at`  | `timestamptz` | -                                   | `now()`            | 最后更新时间                          |

### 2.3 prompt_history（提示词历史表）

记录提示词每次编辑前的快照，用于版本追溯。

| 字段         | 类型          | 约束                                   | 默认值             | 说明                          |
| ------------ | ------------- | -------------------------------------- | ------------------ | ----------------------------- |
| `id`         | `uuid`        | PRIMARY KEY                            | `gen_random_uuid()`| 历史记录唯一标识              |
| `prompt_id`  | `uuid`        | NOT NULL, FK → prompts(id) CASCADE     | -                  | 关联的提示词 ID               |
| `title`      | `text`        | NOT NULL                                | -                  | 编辑时的标题快照              |
| `content`    | `text`        | NOT NULL                                | -                  | 编辑时的内容快照              |
| `tags`       | `text[]`      | -                                       | `'{}'`             | 编辑时的标签快照              |
| `visibility` | `text`        | -                                       | `'private'`        | 编辑时的可见性快照            |
| `edited_by`  | `uuid`        | FK → users(id) SET NULL                | -                  | 编辑者用户 ID（用户删除时置空）|
| `created_at` | `timestamptz` | -                                       | `now()`            | 历史记录创建时间              |

### 2.4 likes（点赞表）

用户对提示词的点赞记录。

| 字段         | 类型          | 约束                                  | 默认值             | 说明                       |
| ------------ | ------------- | ------------------------------------- | ------------------ | -------------------------- |
| `id`         | `uuid`        | PRIMARY KEY                           | `gen_random_uuid()`| 点赞记录唯一标识           |
| `prompt_id`  | `uuid`        | NOT NULL, FK → prompts(id) CASCADE    | -                  | 被点赞的提示词 ID          |
| `user_id`    | `uuid`        | NOT NULL, FK → users(id) CASCADE      | -                  | 点赞用户 ID                |
| `created_at` | `timestamptz` | -                                     | `now()`            | 点赞时间                   |

> **唯一约束**：`UNIQUE(prompt_id, user_id)` —— 同一用户对同一提示词只能点赞一次。

### 2.5 collections（收藏表）

用户对提示词的收藏记录。

| 字段         | 类型          | 约束                                  | 默认值             | 说明                       |
| ------------ | ------------- | ------------------------------------- | ------------------ | -------------------------- |
| `id`         | `uuid`        | PRIMARY KEY                           | `gen_random_uuid()`| 收藏记录唯一标识           |
| `prompt_id`  | `uuid`        | NOT NULL, FK → prompts(id) CASCADE    | -                  | 被收藏的提示词 ID          |
| `user_id`    | `uuid`        | NOT NULL, FK → users(id) CASCADE      | -                  | 收藏用户 ID                |
| `created_at` | `timestamptz` | -                                     | `now()`            | 收藏时间                   |

> **唯一约束**：`UNIQUE(prompt_id, user_id)` —— 同一用户对同一提示词只能收藏一次。

### 2.6 chat_history（聊天历史表）

用户与 AI 模型的对话记录。

| 字段             | 类型          | 约束                                  | 默认值             | 说明                                  |
| ---------------- | ------------- | ------------------------------------- | ------------------ | ------------------------------------- |
| `id`             | `uuid`        | PRIMARY KEY                           | `gen_random_uuid()`| 对话记录唯一标识                      |
| `user_id`        | `uuid`        | NOT NULL, FK → users(id) CASCADE      | -                  | 用户 ID                               |
| `conversation_id`| `uuid`        | -                                     | -                  | 会话 ID（用于将多条消息聚合为一个会话）|
| `user_message`   | `text`        | NOT NULL                              | -                  | 用户发送的消息                        |
| `ai_response`    | `text`        | NOT NULL                              | -                  | AI 返回的响应内容                     |
| `model`          | `text`        | -                                     | -                  | 使用的 AI 模型 ID（如 `Qwen/Qwen2.5-7B-Instruct`） |
| `created_at`     | `timestamptz` | -                                     | `now()`            | 对话时间                              |

### 2.7 templates（模板表）

系统预置的提示词模板，所有用户可见。

| 字段          | 类型          | 约束         | 默认值             | 说明                              |
| ------------- | ------------- | ------------ | ------------------ | --------------------------------- |
| `id`          | `uuid`        | PRIMARY KEY  | `gen_random_uuid()`| 模板唯一标识                      |
| `title`       | `text`        | NOT NULL     | -                  | 模板标题                          |
| `content`     | `text`        | NOT NULL     | -                  | 模板内容（支持 `{变量}` 占位符）  |
| `tags`        | `text[]`      | -            | `'{}'`             | 模板标签                          |
| `category`    | `text`        | -            | -                  | 模板分类（如「写作助手」「编程助手」） |
| `description` | `text`        | -            | -                  | 模板描述                          |
| `created_at`  | `timestamptz` | -            | `now()`            | 创建时间                          |

> `schema.sql` 已预置 3 条示例模板：**文案润色大师**、**代码审查专家**、**翻译官**。

---

## 3. 表关联关系说明

### 3.1 外键关系总览

| 子表              | 外键字段    | 父表        | 父表字段 | 级联规则           | 业务含义                          |
| ----------------- | ----------- | ----------- | -------- | ------------------ | --------------------------------- |
| `prompts`         | `author_id` | `users`     | `id`     | `ON DELETE CASCADE`| 用户删除时，其所有提示词一并删除  |
| `prompt_history`  | `prompt_id` | `prompts`   | `id`     | `ON DELETE CASCADE`| 提示词删除时，其历史记录一并删除  |
| `prompt_history`  | `edited_by` | `users`     | `id`     | `ON DELETE SET NULL`| 用户删除时，历史记录保留，编辑者置空 |
| `likes`           | `prompt_id` | `prompts`   | `id`     | `ON DELETE CASCADE`| 提示词删除时，相关点赞一并删除    |
| `likes`           | `user_id`   | `users`     | `id`     | `ON DELETE CASCADE`| 用户删除时，其点赞记录一并删除    |
| `collections`     | `prompt_id` | `prompts`   | `id`     | `ON DELETE CASCADE`| 提示词删除时，相关收藏一并删除    |
| `collections`     | `user_id`   | `users`     | `id`     | `ON DELETE CASCADE`| 用户删除时，其收藏记录一并删除    |
| `chat_history`    | `user_id`   | `users`     | `id`     | `ON DELETE CASCADE`| 用户删除时，其聊天记录一并删除    |

### 3.2 级联删除规则说明

- **CASCADE（级联删除）**：父记录删除时，自动删除所有关联的子记录。用于强从属关系（如用户→提示词→历史/点赞/收藏）。
- **SET NULL（置空）**：父记录删除时，子记录保留，外键字段置为 NULL。用于保留审计痕迹（如 `prompt_history.edited_by`）。
- **设计原则**：`templates` 表无外键关联，独立存在；其余 6 张表均通过 `users.id` 或 `prompts.id` 形成层级关系。

### 3.3 关联关系文字描述

1. **users 1 ──── N prompts**：一个用户可创建多条提示词。
2. **users 1 ──── N prompt_history**：一个用户可编辑产生多条历史记录（通过 `edited_by`）。
3. **prompts 1 ──── N prompt_history**：一条提示词可有多条编辑历史。
4. **users 1 ──── N likes**：一个用户可点赞多条提示词。
5. **prompts 1 ──── N likes**：一条提示词可被多个用户点赞。
6. **users 1 ──── N collections**：一个用户可收藏多条提示词。
7. **prompts 1 ──── N collections**：一条提示词可被多个用户收藏。
8. **users 1 ──── N chat_history**：一个用户可有多条聊天记录。
9. **templates**：独立表，无关联关系。

---

## 4. ER 实体关系图（ASCII）

```
                            ┌─────────────────────────────────┐
                            │            users                │
                            ├─────────────────────────────────┤
                            │ id          (PK, uuid)          │
                            │ email       (UNIQUE, text)      │
                            │ password    (text)              │
                            │ salt        (text)              │
                            │ nickname    (text)              │
                            │ avatar_url  (text)              │
                            │ avatar_path (text)              │
                            │ avatar      (text)              │
                            │ created_at  (timestamptz)       │
                            │ updated_at  (timestamptz)       │
                            └──────────────┬──────────────────┘
                                           │ 1
                ┌──────────────────────────┼──────────────────────────────────────┐
                │ N                        │ N                                     │ N
                ▼                          ▼                                       ▼
  ┌─────────────────────────┐  ┌─────────────────────────┐         ┌─────────────────────────┐
  │       prompts           │  │       chat_history      │         │     prompt_history      │
  ├─────────────────────────┤  ├─────────────────────────┤         ├─────────────────────────┤
  │ id          (PK, uuid)  │  │ id           (PK, uuid) │         │ id          (PK, uuid)  │
  │ title       (text)      │  │ user_id      (FK→users) │         │ prompt_id   (FK→prompts)│
  │ content     (text)      │  │ conversation_id(uuid)   │         │ title       (text)      │
  │ tags        (text[])    │  │ user_message (text)     │         │ content     (text)      │
  │ visibility  (text)      │  │ ai_response  (text)     │         │ tags        (text[])    │
  │ author_id   (FK→users)  │  │ model        (text)     │         │ visibility  (text)      │
  │ likes_count (int)       │  │ created_at   (timestz)  │         │ edited_by   (FK→users)  │
  │ created_at  (timestz)   │  └─────────────────────────┘         │ created_at  (timestz)   │
  │ updated_at  (timestz)   │                                      └─────────────────────────┘
  └─────────────┬───────────┘                                                   ▲
                │ 1                                                             │ N
       ┌────────┴────────┐                                       edited_by SET NULL
       │ N               │ N
       ▼                 ▼
  ┌────────────────────┐  ┌────────────────────┐
  │       likes        │  │    collections     │
  ├────────────────────┤  ├────────────────────┤
  │ id        (PK,uuid)│  │ id        (PK,uuid)│
  │ prompt_id(FK→promp)│  │ prompt_id(FK→promp)│
  │ user_id  (FK→users)│  │ user_id  (FK→users)│
  │ created_at(timestz)│  │ created_at(timestz)│
  │ UNIQUE(prompt,user)│  │ UNIQUE(prompt,user)│
  └────────────────────┘  └────────────────────┘

  ┌─────────────────────────────────┐
  │           templates             │   独立表，无外键关联
  ├─────────────────────────────────┤   所有人可读（RLS: true）
  │ id          (PK, uuid)          │
  │ title       (text)              │
  │ content     (text)              │
  │ tags        (text[])            │
  │ category    (text)              │
  │ description (text)              │
  │ created_at  (timestamptz)       │
  └─────────────────────────────────┘
```

**图例说明**
- `PK` = 主键
- `FK→` = 外键引用
- `UNIQUE` = 唯一约束
- `1` / `N` = 一对多关系
- `SET NULL` = 级联规则为置空

---

## 5. 索引设计说明

### 5.1 索引清单

| 索引名                              | 表               | 索引字段              | 索引类型 | 优化目的                                          |
| ----------------------------------- | ---------------- | --------------------- | -------- | ------------------------------------------------- |
| `idx_prompts_author_id`             | `prompts`        | `author_id`           | B-Tree   | 加速「按作者查询提示词」「我的提示词列表」        |
| `idx_prompts_visibility`            | `prompts`        | `visibility`          | B-Tree   | 加速「公开提示词广场」过滤                        |
| `idx_prompts_created_at`            | `prompts`        | `created_at DESC`     | B-Tree   | 加速按时间倒序的分页查询（最新优先）              |
| `idx_prompts_tags`                  | `prompts`        | `tags`                | GIN      | 加速数组标签的包含查询（`tags @> ARRAY[...]`）     |
| `idx_likes_prompt_user`             | `likes`          | `(prompt_id, user_id)`| B-Tree   | 加速「判断用户是否已点赞」与唯一约束校验          |
| `idx_collections_prompt_user`       | `collections`    | `(prompt_id, user_id)`| B-Tree   | 加速「判断用户是否已收藏」与唯一约束校验          |
| `idx_chat_history_user_id`          | `chat_history`   | `user_id`             | B-Tree   | 加速「用户的聊天历史列表」查询                    |
| `idx_prompt_history_prompt_id`      | `prompt_history` | `prompt_id`           | B-Tree   | 加速「按提示词查询编辑历史」                      |

### 5.2 设计要点

1. **主键自动索引**：所有表的 `id` 主键自动创建 B-Tree 索引，无需手动声明。
2. **外键字段索引**：所有作为外键的字段均已建立索引，避免关联查询时的全表扫描。
3. **GIN 索引**：`prompts.tags` 使用 GIN 索引，专门优化 PostgreSQL 数组类型的包含查询。
4. **降序索引**：`prompts.created_at` 使用 `DESC` 降序索引，匹配「最新优先」的常见排序场景。
5. **复合索引**：`likes` 与 `collections` 的 `(prompt_id, user_id)` 复合索引同时服务于查询和唯一约束。

---

## 6. Supabase Storage 存储桶权限设计

### 6.1 avatars 存储桶

| 属性       | 值          | 说明                                                   |
| ---------- | ----------- | ------------------------------------------------------ |
| bucket id  | `avatars`   | 存储桶标识                                             |
| name       | `avatars`   | 存储桶名称                                             |
| public     | `true`      | 公开存储桶，任何人可通过 URL 读取头像                  |

### 6.2 权限设计

| 操作       | 权限主体              | 访问方式      | 说明                                          |
| ---------- | --------------------- | ------------- | --------------------------------------------- |
| **读取**   | 任意用户（匿名）      | 公开 URL      | 头像通过 `avatar_url` 字段公开访问，无需鉴权  |
| **写入**   | 已认证用户            | API + Token   | 上传/更新头像需通过应用层鉴权后调用 Storage   |
| **删除**   | 已认证用户（本人）    | API + Token   | 仅允许删除自己的头像对象                      |

### 6.3 创建方式

可通过两种方式创建 `avatars` 存储桶：

1. **Dashboard 手动创建**（推荐）：
   - 进入 Supabase Dashboard → Storage → New bucket
   - 名称填 `avatars`
   - 勾选 **Public bucket**
   - 点击保存

2. **SQL 脚本创建**：`schema.sql` 中已包含创建逻辑（仅在 `storage` schema 存在时执行）：

```sql
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true)
    on conflict (id) do nothing;
  end if;
end $$;
```

### 6.4 CORS 策略

`avatars` 存储桶的 CORS 配置仅允许本地开发域名访问：

| 配置项             | 值                                                          |
| ------------------ | ----------------------------------------------------------- |
| allowed_origins    | `http://localhost:3000`、`http://127.0.0.1:3000`            |
| allowed_methods    | `GET`、`POST`、`PUT`、`DELETE`、`HEAD`                      |
| allowed_headers    | `Content-Type`、`Authorization`、`x-upsert`                 |
| exposed_headers    | `Content-Length`、`ETag`                                    |
| max_age_seconds    | `3600`                                                      |

> 完整 CORS 配置见 `supabase/cors-policy.json`。

---

## 7. RLS 行级安全策略说明

### 7.1 设计理念

- **应用层鉴权为主**：本项目使用 `service_role` key 绕过 RLS，所有数据访问权限由 Next.js API 路由基于自定义 JWT 控制。
- **RLS 作为安全兜底**：即使 `anon key` 在前端暴露，由于所有表均已启用 RLS 并配置了限制策略，攻击者也无法读取到他人私有数据。
- **只读策略**：本项目 RLS 仅配置 `SELECT` 策略，所有写操作由 `service_role` key 在服务端完成，绕过 RLS。

### 7.2 各表 RLS 策略

所有 7 张表均已执行 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`。

| 表              | 策略名                       | 操作     | 策略表达式                                              | 说明                                   |
| --------------- | ---------------------------- | -------- | ------------------------------------------------------- | -------------------------------------- |
| `users`         | `users read own`             | SELECT   | `auth.uid() = id`                                       | 用户仅能读取自己的信息                 |
| `prompts`       | `prompts read public or own` | SELECT   | `visibility = 'public' OR auth.uid() = author_id`       | 公开提示词所有人可读，私密的仅作者可读 |
| `prompt_history`| `prompt_history read own`    | SELECT   | `auth.uid() = edited_by`                                | 仅编辑者本人可读历史记录               |
| `likes`         | `likes read own`             | SELECT   | `auth.uid() = user_id`                                  | 用户仅能读取自己的点赞记录             |
| `collections`   | `collections read own`       | SELECT   | `auth.uid() = user_id`                                  | 用户仅能读取自己的收藏记录             |
| `chat_history`  | `chat_history read own`      | SELECT   | `auth.uid() = user_id`                                  | 用户仅能读取自己的聊天记录             |
| `templates`     | `templates read all`         | SELECT   | `true`                                                  | 所有人可读（模板为公开资源）           |

### 7.3 策略说明

- `auth.uid()` 是 Supabase 内置函数，返回当前请求者的用户 ID。本项目未使用 Supabase Auth，因此通过 `anon key` 直接访问时 `auth.uid()` 返回 NULL，所有需要身份匹配的策略将拒绝访问。
- `templates` 表策略为 `true`，允许匿名读取，因为模板是公开资源。
- 所有写操作（INSERT/UPDATE/DELETE）均通过 `service_role` key 在服务端 API 路由中执行，绕过 RLS。

---

## 8. 线上 RLS 与 Storage 权限配置

> **域名完成实名认证 + DNS 解析后补充完善线上 RLS 和 Storage 权限配置**
>
> 本章节预留，待自定义域名 `szy050604.top` 完成以下事项后补充：
> 1. 阿里云域名实名认证
> 2. DNS 解析配置
> 3. Vercel 自定义域名绑定
> 4. 线上 CORS 策略调整（添加生产域名到 `allowed_origins`）
> 5. Storage 存储桶线上权限校验
> 6. RLS 策略线上验证
>
> **当前状态**：项目代码已推送 GitHub，本地功能全部实现，唯一缺失为线上 Demo 访问链接。

---

## 附录：数据库初始化脚本

完整的数据库初始化脚本位于 `supabase/schema.sql`，包含：

1. 启用 `pgcrypto` 扩展
2. 创建 7 张数据表（含外键约束）
3. 创建 8 个索引
4. 启用 7 张表的 RLS 并创建 7 条 SELECT 策略
5. 创建 `avatars` Storage 存储桶
6. 插入 3 条示例模板数据

执行方式：在 Supabase Dashboard → SQL Editor 中粘贴并执行整个脚本。
