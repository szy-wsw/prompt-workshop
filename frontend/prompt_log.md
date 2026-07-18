# Prompt Workshop — Prompt 工程开发日志

> 本文档为 Prompt Workshop 项目（Next.js 16 + Supabase + SiliconFlow AI）开发全过程中使用的 Prompt 记录，作为「AI 工具运用」分值（占考核 20%）的核心支撑材料。

---

## 一、说明

### 1.1 Prompt 工程简介

Prompt 工程是指在与大语言模型（LLM）交互时，通过精心设计输入指令的结构、上下文、约束与输出格式，以最大化模型输出质量与可控性的方法论。优秀的 Prompt 通常包含以下要素：

- **角色设定**：明确 LLM 扮演的专家身份（如「你是一位 Next.js 安全专家」），引导其调用对应领域知识。
- **上下文提供**：给出项目背景、技术栈、已有代码片段，避免模型凭空臆造。
- **明确约束**：列出必须满足的硬性要求（如「使用 bcrypt」「密码至少 6 位」）。
- **输出格式约束**：要求以特定形式输出（如「TypeScript 完整代码」「JSON Schema」），便于直接落地。
- **分步指令**：将复杂任务拆解为有序步骤，降低模型理解负担。
- **示例驱动**：通过 few-shot 示例引导模型对齐期望风格。

### 1.2 使用 Cursor AI 的方法论

本项目以 **Cursor AI**（基于 GPT-4 / Claude 的代码编辑器）作为主要开发工具，采用以下工作流：

1. **规划阶段**：在 `docs/` 目录维护需求清单与数据库 schema 文档，作为 Prompt 的上下文素材。
2. **生成阶段**：在 Cursor Chat 或 Composer 中输入结构化 Prompt，让 AI 生成首版代码。
3. **审阅阶段**：人工 review AI 输出，关注类型安全、安全漏洞、与现有代码风格的一致性。
4. **迭代阶段**：针对 AI 输出的不足，使用「指出问题 → 给出修复方向 → 要求重新生成」的多轮对话模式。
5. **沉淀阶段**：将验证有效的 Prompt 模板沉淀到本文档，便于后续复用。

### 1.3 项目开发周期

- **总周期**：7 天
- **每日节奏**：白天开发 + 晚上记录 Prompt 与 review
- **阶段分布**：

| 阶段 | 天数 | Prompt 数 |
| --- | --- | --- |
| 环境搭建 | 0.5 | 2 |
| 数据库设计 | 0.5 | 2 |
| 认证系统 | 1 | 3 |
| 提示词 CRUD | 1 | 3 |
| 点赞收藏 | 0.5 | 2 |
| AI 对话 | 1 | 2 |
| 头像上传 | 0.5 | 1 |
| 前端页面 | 1.5 | 3 |
| 部署配置 | 0.5 | 1 |
| Bug 修复 | 0.5 | 2 |
| **合计** | **7** | **21** |

### 1.4 项目当前状态

- **代码托管**：项目代码已推送 GitHub，可随时拉取复现。
- **本地验证**：`localhost:3000` 全部功能实现并验证通过，包含注册、登录、提示词 CRUD、点赞、收藏、AI 对话、头像上传、版本历史等。
- **线上状态**：域名 `szy050604.top` 已购买但未完成实名认证 + DNS 解析，线上 Demo 链接暂缺。

> **线上 Demo 链接**：域名完成实名认证 + DNS 解析后补充完善。

---

## 二、按开发阶段分组的 Prompt 记录

### 阶段 1：环境搭建

#### Prompt #01 — 项目初始化与依赖选型

- **Prompt 内容**：
  > 你是一位资深 Next.js 全栈工程师。我要搭建一个名为「Prompt Workshop」的提示词管理与 AI 对话实训项目。请帮我完成以下任务：
  >
  > 1. 使用 `create-next-app@latest` 初始化项目，App Router 模式，TypeScript，启用 ESLint 与 Tailwind CSS v4。
  > 2. 安装核心依赖：`@supabase/ssr`、`@supabase/supabase-js`、`antd` v6。
  > 3. 创建 `lib/supabase/` 目录，按 `client.ts`、`server.ts`、`admin.ts` 三文件拆分客户端、服务端、管理员三种 Supabase Client。
  > 4. 配置 `.env.local` 模板，包含 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`JWT_SECRET`、`SILICONFLOW_API_KEY`、`FREE_MODEL_ID`。
  >
  > 请输出：
  > - 完整的 `package.json` 依赖清单
  > - 三个 Supabase Client 文件的 TypeScript 代码
  > - `.env.local.example` 模板
  > - 每段代码后附简短说明

- **AI 输出摘要**：
  - 生成 `package.json`，包含 `next: 16.2.10`、`react: 19.2.4`、`@supabase/ssr: ^0.12.3`、`antd: ^6.5.1` 等依赖。
  - `lib/supabase/client.ts` 使用 `createBrowserClient` 导出 `createClient()` 与单例 `supabase`。
  - `lib/supabase/server.ts` 使用 `createServerClient` 配合 `cookies()` 异步读取。
  - `lib/supabase/admin.ts` 使用 `createClient` from `@supabase/supabase-js`，开启 `autoRefreshToken: false`、`persistSession: false`。

- **对应文件/功能**：`package.json`、`lib/supabase/client.ts`、`lib/supabase/server.ts`、`lib/supabase/admin.ts`、`.env.local.example`

- **使用技巧说明**：
  - **角色设定**：明确「资深 Next.js 全栈工程师」身份，引导模型调用最新 App Router 知识。
  - **明确技术要求**：指定 App Router、TypeScript、Tailwind v4、antd v6 等具体版本。
  - **输出格式约束**：要求「每段代码后附简短说明」，便于人工审阅。
  - **分步指令**：4 个有序步骤，避免遗漏。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #02 — TypeScript 配置与路径别名

- **Prompt 内容**：
  > 我使用 Next.js 16 + TypeScript 5。请生成 `tsconfig.json`，要求：
  >
  > 1. `target: ES2022`、`module: ESNext`、`moduleResolution: Bundler`。
  > 2. 开启 `strict: true`、`noUnusedLocals: true`、`noImplicitOverride: true`。
  > 3. 配置路径别名 `@/*` 指向项目根目录的 `./`，便于 `@/lib/...`、`@/components/...` 引用。
  > 4. 排除 `node_modules` 与 `.next` 目录。
  >
  > 请以 JSON 格式输出，不要多余解释。

- **AI 输出摘要**：生成 `tsconfig.json`，含 `compilerOptions.paths: { "@/*": ["./*"] }`，`include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]`。

- **对应文件/功能**：`tsconfig.json`

- **使用技巧说明**：
  - **输出格式约束**：「JSON 格式输出，不要多余解释」确保输出可直接复制落地。
  - **明确约束**：列出 4 个具体编译选项，避免模型自由发挥引入额外配置。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 2：数据库设计

#### Prompt #03 — Supabase 表结构 SQL

- **Prompt 内容**：
  > 你是 Supabase 数据库设计专家。请为「Prompt Workshop」项目设计 SQL 建表语句，需求如下：
  >
  > 1. `users` 表：`id`(uuid, default gen_random_uuid(), PK)、`email`(text, unique, not null)、`nickname`(text, not null)、`password`(text, not null)、`salt`(text, not null)、`avatar_url`(text)、`avatar_path`(text)、`created_at`(timestamptz, default now())、`updated_at`(timestamptz, default now())。
  > 2. `prompts` 表：`id`(uuid, PK)、`title`(text, not null)、`content`(text, not null)、`tags`(text[], default '{}')、`visibility`(text, check in ('public','private'), default 'private')、`author_id`(uuid, references users(id))、`likes_count`(int, default 0)、`created_at`、`updated_at`。
  > 3. `prompt_history` 表：记录每次编辑历史，包含 `prompt_id`、`title`、`content`、`tags`、`visibility`、`edited_by`、`created_at`。
  > 4. `likes` 表：联合主键 `(prompt_id, user_id)`，记录点赞关系。
  > 5. `collections` 表：联合主键 `(prompt_id, user_id)`，记录收藏关系。
  > 6. `chat_history` 表：`id`、`user_id`、`conversation_id`、`user_message`、`ai_response`、`model`、`created_at`。
  >
  > 请：
  > - 启用 RLS，对 `prompts` 表配置公开读 `visibility = 'public'` 的策略，写操作仅限 `auth.uid() = author_id`。
  > - 给 `users.email`、`prompts.author_id`、`prompts.created_at` 加索引。
  > - 输出可直接执行的 `.sql` 文件内容。

- **AI 输出摘要**：
  - 生成 6 张表的 `create table if not exists` 语句，含 `gen_random_uuid()`、`check` 约束、外键。
  - 启用 RLS：`alter table prompts enable row level security;`
  - 创建策略：`create policy "public read" on prompts for select using (visibility = 'public');`
  - 创建索引：`create index idx_prompts_author_id on prompts(author_id);`

- **对应文件/功能**：`supabase/schema.sql`、`supabase/policies.sql`

- **使用技巧说明**：
  - **上下文提供**：列出 6 张表所有字段定义，避免模型遗漏字段类型。
  - **明确约束**：要求 RLS、索引、check 约束同时输出。
  - **输出格式约束**：要求「可直接执行的 .sql 文件内容」。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #04 — 后端工具函数封装

- **Prompt 内容**：
  > 我使用 Supabase 作为数据库，需要在 Next.js 16 服务端封装统一的数据库工具函数，方便各 API Route 调用。请创建 `lib/supabase-server.ts`，要求：
  >
  > 1. 通过 `getAdminClient()` 获取单例 Supabase Client（service role）。
  > 2. 封装通用函数：
  >    - `dbQuery<T>(table, query, options)`：支持 `limit`、`offset`、`orderBy`、`orderDirection`、`searchFields/ilike`、`containsField/tags`。
  >    - `dbAdd<T>(table, data)`：插入并返回新记录。
  >    - `dbUpdate<T>(table, query, data)`：按条件更新。
  >    - `dbDelete(table, query)`：按条件删除。
  >    - `dbCount(table, query)`：返回计数。
  >    - `dbGetOne<T>(table, query)`：取首条。
  > 3. 封装 JWT 工具：`generateToken(payload, expiresIn)`、`verifyToken(token)`，使用 HS256，密钥从 `process.env.JWT_SECRET` 读取。
  > 4. 封装 `verifyAuth(req)`：从 Authorization 头解析 Bearer token，返回 `{ userId, error? }`。
  > 5. 封装统一响应：`successResponse(data, message)`、`errorResponse(message, status)`、`handleOptions()`（处理 CORS preflight）。
  > 6. 封装文件存储工具：`uploadFileToCloud(bucket, path, buffer, mime)`、`getPublicFileUrl(bucket, path)`、`deleteCloudFile(bucket, path)`。
  >
  > 所有函数使用 TypeScript，避免 `any` 类型，使用泛型 T 表示返回行类型。请输出完整代码。

- **AI 输出摘要**：
  - 生成完整的 `lib/supabase-server.ts`，含所有工具函数。
  - `dbQuery` 内部使用 `for...of` 遍历 query 对象，依次 `.eq()` 拼接。
  - `generateToken` 使用 `crypto.createHmac('sha256')`，`verifyToken` 解析 base64 后比对签名。
  - `verifyAuth` 调用 `verifyToken` 并返回 `{ userId, error }`。
  - 三类响应函数与 CORS 处理。

- **对应文件/功能**：`lib/supabase-server.ts`

- **使用技巧说明**：
  - **分步指令**：6 个清晰的封装要求，逐项落地。
  - **明确约束**：「避免 any 类型，使用泛型 T」引导类型安全。
  - **上下文提供**：明确函数签名与参数语义，避免模型自由发挥。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 3：认证系统

#### Prompt #05 — 用户注册 API

- **Prompt 内容**：
  > 你是一位 Next.js 安全专家。请帮我实现用户注册 API，要求：
  >
  > 1. 使用 `pbkdf2Sync`（迭代 100000 次，64 位，sha512）哈希密码，并生成 16 字节随机 salt。
  > 2. 邮箱唯一性校验：注册前先查询 `users` 表，已存在则返回 400。
  > 3. 输入校验：昵称 2-20 字符、邮箱格式校验（含 `@` 与 `.`）、密码至少 6 位。
  > 4. 写入 `users` 表，字段：`email`、`password`、`salt`、`nickname`、`avatar_url: ''`、`created_at`、`updated_at`。
  > 5. 注册成功后返回 `{ success: true, message: '注册成功，请登录' }`，不直接返回 token（前端会自动调用登录接口）。
  > 6. 使用 `runtime = 'nodejs'` 声明。
  > 7. 错误处理：try-catch 包裹，数据库错误单独捕获并打印 log。
  >
  > 文件路径：`app/api/signup/route.ts`。请输出完整 TypeScript 代码。

- **AI 输出摘要**：
  - 生成 `app/api/signup/route.ts`，含 `OPTIONS`、`POST` 两个 handler。
  - `hashPassword(password, salt)` 使用 `crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')`。
  - `generateSalt()` 使用 `crypto.randomBytes(16).toString('hex')`。
  - 输入校验按序返回 400 错误消息。
  - 双 try-catch：外层捕获整体异常，内层捕获数据库异常。

- **对应文件/功能**：`app/api/signup/route.ts`

- **使用技巧说明**：
  - **角色设定**：「Next.js 安全专家」引导模型关注安全细节（salt、pbkdf2、迭代次数）。
  - **明确技术要求**：明确指定 pbkdf2Sync 参数，避免模型选择弱算法（如 MD5）。
  - **输出格式约束**：要求完整 TypeScript 代码，可直接落地。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #06 — 用户登录 API 与 JWT 签发

- **Prompt 内容**：
  > 基于上一条注册 API 的实现，请帮我实现登录 API，路径 `app/api/login/route.ts`。要求：
  >
  > 1. 接收 `{ email, password }`，校验非空。
  > 2. 查询 `users` 表，按 email 取唯一记录；不存在则返回「邮箱或密码错误」（不区分邮箱是否存在，防枚举）。
  > 3. 使用相同的 `hashPassword(password, salt)` 函数重新计算哈希，与数据库 `password` 字段比对。
  > 4. 比对成功后调用 `generateToken({ userId, email }, '24h')` 签发 JWT，有效期 24 小时。
  > 5. 返回结构：
  >    ```json
  >    {
  >      "success": true,
  >      "message": "登录成功",
  >      "data": {
  >        "user": { "id", "email", "nickname", "avatar_url" },
  >        "session": { "access_token", "refresh_token": "", "expires_at": <unix秒> }
  >      }
  >    }
  >    ```
  > 6. `hashPassword` 与 `generateToken` 均从 `@/lib/supabase-server` 导入或本地实现，避免重复定义。
  > 7. 登录失败时返回 400 + 错误消息。
  >
  > 请输出完整代码，并解释 token 的有效期如何配置。

- **AI 输出摘要**：
  - 生成 `app/api/login/route.ts`，使用与注册相同的 `hashPassword` 函数。
  - 调用 `generateToken({ userId: user.id, email: user.email })`，默认 24h。
  - 计算 `expiresAt = Math.floor(Date.now() / 1000) + 86400`。
  - 返回符合约定结构的 JSON。

- **对应文件/功能**：`app/api/login/route.ts`

- **使用技巧说明**：
  - **上下文提供**：引用「上一条注册 API」作为上下文，保持函数一致性。
  - **示例驱动**：直接给出期望的 JSON 响应结构，避免模型自由设计字段。
  - **安全要求**：明确「不区分邮箱是否存在，防枚举」。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #07 — 前端认证上下文与 localStorage 持久化

- **Prompt 内容**：
  > 你是 React Context 与 Next.js App Router 专家。请帮我实现前端认证上下文 `lib/auth.tsx`，要求：
  >
  > 1. 定义 `User` 接口：`{ id, email, nickname, avatar_url? }`。
  > 2. 定义 `AuthContextType`，包含：`user`、`loading`、`token`、`register`、`login`、`logout`、`requireAuth`、`updateProfile`、`updatePassword`、`updateAvatar`。
  > 3. `AuthProvider` 组件：
  >    - 使用 `useState` 管理 `user`、`token`、`loading`。
  >    - `useEffect` 在挂载时从 `localStorage` 读取 `auth_token` 与 `auth_user`，若 JSON 解析失败则清除。
  >    - `register(email, password, nickname, confirmPassword)`：先调用 `/api/signup`，成功后再调用 `/api/login` 自动登录。
  >    - `login(email, password)`：调用 `/api/login`，成功后写入 localStorage 并更新 state。
  >    - `logout()`：清除 state 与 localStorage。
  >    - `requireAuth()`：返回 `!!user && !!token`，用于前端路由守卫。
  >    - `updateProfile({ nickname })`：PUT `/api/profile`，成功后合并更新 user。
  >    - `updatePassword(oldPassword, newPassword)`：PUT `/api/profile` 带 `old_password/new_password`。
  >    - `updateAvatar(file)`：POST `/api/profile`，使用 FormData，注意 headers 不要手动设置 `Content-Type`。
  > 4. 所有 fetch 调用统一在 headers 中注入 `Authorization: Bearer ${token}`（若 token 存在）。
  > 5. 导出 `useAuth()` hook，未在 Provider 内使用时抛错。
  > 6. 顶部 `'use client'` 指令。
  >
  > 请输出完整 TypeScript 代码，并对每个方法添加一行 JSDoc 注释。

- **AI 输出摘要**：
  - 生成 `lib/auth.tsx`，含 `'use client'` 指令、`User`/`AuthContextType` 接口、`AuthProvider` 组件、`useAuth` hook。
  - `register` 内部串联 `/api/signup` → `/api/login`，注册成功自动登录。
  - `updateAvatar` 使用 `FormData`，headers 仅注入 `Authorization`。
  - `useAuth` 抛出 `useAuth must be used within an AuthProvider` 错误。

- **对应文件/功能**：`lib/auth.tsx`

- **使用技巧说明**：
  - **角色设定**：「React Context 与 Next.js App Router 专家」。
  - **分步指令**：6 个有序要求，逐项落地。
  - **细节约束**：明确 `updateAvatar` 不要手动设置 `Content-Type`（关键坑点）。
  - **输出格式约束**：要求 JSDoc 注释，便于团队协作。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 4：提示词 CRUD

#### Prompt #08 — 提示词列表查询 API

- **Prompt 内容**：
  > 请帮我实现 `app/api/prompts/route.ts` 的 GET handler，需求：
  >
  > 1. 支持查询参数：`user_id`、`visibility`、`search`（在 title/content 模糊搜索）、`tag`（在 tags 数组中包含）、`prompt_id`、`page`（默认 1）、`per_page`（默认 50）。
  > 2. 权限逻辑：
  >    - 若传 `prompt_id`：直接按 id 查询。
  >    - 若同时传 `user_id` 与 `visibility`：按两者过滤。
  >    - 若只传 `user_id`：调用 `verifyAuth(req)`，若 userId === user_id 则查该用户所有提示词，否则只查该用户 public 提示词。
  >    - 若只传 `visibility`：按 visibility 过滤。
  >    - 否则：默认只查 public。
  > 3. 使用 `dbQuery('prompts', query, options)` 拉取数据，`dbCount('prompts', query)` 获取总数。
  > 4. 调用 `attachAuthorProfiles(prompts)` 关联作者信息（仅 nickname + avatar_url）。
  > 5. 返回 `{ success: true, data: { data: [...], total: <number> } }`。
  > 6. 使用 `runtime = 'nodejs'`。
  >
  > 同时实现 `attachAuthorProfiles` 辅助函数：从 prompts 中收集 `author_id`，一次性查询 users 表，构建 Map 后回填 `profiles` 字段。请输出完整代码。

- **AI 输出摘要**：
  - 生成 GET handler，按 6 种 query 组合分支处理权限。
  - `attachAuthorProfiles` 内部使用 `[...new Set(prompts.map(p => p.author_id))]` 去重。
  - 通过 `dbQuery('users', {}, {})` 拉取所有用户后构建 Map（后评审中发现性能问题）。
  - 使用 `dbCount` 获取总数。

- **对应文件/功能**：`app/api/prompts/route.ts`（GET 部分）

- **使用技巧说明**：
  - **明确约束**：详细列出 5 种权限分支，避免模型遗漏边界。
  - **示例驱动**：明确返回 JSON 结构。
  - **分步指令**：先 GET 主流程，再单独说明 `attachAuthorProfiles`。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #09 — 提示词创建 API 与版本历史

- **Prompt 内容**：
  > 在同一个 `app/api/prompts/route.ts` 文件中追加 POST handler，需求：
  >
  > 1. 调用 `verifyAuth(req)` 鉴权，未登录返回 401。
  > 2. 解析 body：`{ title, content, tags?, visibility? }`。
  > 3. `tags` 默认 `[]`，`visibility` 默认 `'private'`。
  > 4. 当前时间 `now = new Date().toISOString()`。
  > 5. 调用 `dbAdd('prompts', { title, content, tags, visibility, author_id: userId, likes_count: 0, created_at: now, updated_at: now })` 插入。
  > 6. 取返回的 `result.id`，再调用 `dbAdd('prompt_history', { prompt_id, title, content, tags, visibility, edited_by: userId, created_at: now })` 记录首版历史。
  > 7. 返回 `{ success: true, data: { ...result, id: promptId }, message: '创建成功' }`。
  > 8. try-catch 包裹，异常返回 400 + 错误消息。
  >
  > 请只输出 POST handler 的代码，不要重复输出 GET 部分。

- **AI 输出摘要**：
  - 生成 POST handler，调用 `verifyAuth` 鉴权。
  - 双 `dbAdd` 调用：先 prompts，后 prompt_history。
  - 异常捕获返回 `创建失败: ${e.message}`。

- **对应文件/功能**：`app/api/prompts/route.ts`（POST 部分）

- **使用技巧说明**：
  - **上下文提供**：明确「同一个文件追加 POST handler」，避免模型重新生成 GET。
  - **输出格式约束**：「只输出 POST handler 代码」减少 token 浪费。
  - **明确约束**：列出所有字段默认值。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #10 — 提示词编辑/删除与版本回滚

- **Prompt 内容**：
  > 请实现 `app/api/prompts/[id]/route.ts`，支持 PUT 与 DELETE：
  >
  > 1. PUT `/api/prompts/:id`：
  >    - 鉴权后查询该 prompt，校验 `prompt.author_id === userId`，否则返回 403。
  >    - 更新 `title`、`content`、`tags`、`visibility`、`updated_at`。
  >    - 同步往 `prompt_history` 插入一条新版本记录。
  >    - 返回更新后的 prompt。
  > 2. DELETE `/api/prompts/:id`：
  >    - 鉴权 + 权限校验同上。
  >    - 删除 `prompts` 表记录、关联的 `prompt_history`、`likes`、`collections`。
  >    - 返回 `{ success: true, message: '删除成功' }`。
  > 3. 额外实现 GET `/api/prompts/:id/history`：返回该 prompt 的全部历史版本，按 `created_at desc` 排序。
  > 4. 使用动态路由参数 `params: { id: string }`（Next.js 16 中 params 为 Promise，需 `await params`）。
  > 5. 全部使用 `runtime = 'nodejs'`。
  >
  > 请输出完整的 3 个 handler 代码。

- **AI 输出摘要**：
  - 生成 `app/api/prompts/[id]/route.ts`，含 PUT、DELETE。
  - 生成 `app/api/prompts/[id]/history/route.ts`，含 GET。
  - 使用 `const { id } = await params` 适配 Next.js 16 异步 params。
  - DELETE 中串联删除 4 张表。

- **对应文件/功能**：`app/api/prompts/[id]/route.ts`、`app/api/prompts/[id]/history/route.ts`

- **使用技巧说明**：
  - **上下文提供**：明确 Next.js 16 params 为 Promise 的版本特性，避免模型用旧 API。
  - **分步指令**：3 个 handler 分别说明。
  - **权限要求**：明确「鉴权 + author_id 校验」双重保护。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 5：点赞收藏

#### Prompt #11 — 点赞 API 与防重复

- **Prompt 内容**：
  > 请实现 `app/api/likes/route.ts`，需求：
  >
  > 1. POST `/api/likes`：
  >    - 鉴权后接收 `{ prompt_id, user_id }`，校验 `user_id === authResult.userId` 防篡改。
  >    - 查询 `likes` 表是否已存在 `(prompt_id, user_id)`，存在则返回「已点赞」。
  >    - 不存在则插入，并调用 `dbUpdate('prompts', { id: prompt_id }, { likes_count: 当前+1 })`（或使用 SQL `likes_count + 1`）。
  >    - 返回 `{ success: true, message: '点赞成功' }`。
  > 2. DELETE `/api/likes`：
  >    - 删除 `likes` 表对应记录。
  >    - `likes_count` 减 1，但不得小于 0。
  > 3. GET `/api/likes/check?prompt_id=&user_id=`：
  >    - 鉴权后查询 `likes` 表，返回 `{ success: true, data: { liked: true/false } }`。
  > 4. 所有操作需鉴权，使用 `dbQuery`/`dbAdd`/`dbDelete`/`dbUpdate`。
  > 5. 错误处理统一 try-catch。
  >
  > 请输出完整代码。

- **AI 输出摘要**：
  - 生成 `app/api/likes/route.ts`，含 POST、DELETE、GET（check）。
  - 通过 `dbQuery('likes', { prompt_id, user_id })` 检查重复。
  - `likes_count` 增减通过 `dbUpdate` 实现。
  - 防篡改校验 `authResult.userId !== user_id` 返回 403。

- **对应文件/功能**：`app/api/likes/route.ts`

- **使用技巧说明**：
  - **安全要求**：明确「校验 user_id === authResult.userId 防篡改」。
  - **业务约束**：明确「likes_count 不得小于 0」。
  - **分步指令**：3 个 handler 分别说明。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #12 — 收藏 API 与列表查询

- **Prompt 内容**：
  > 仿照点赞 API 的实现，请实现收藏 API `app/api/collections/route.ts`，需求：
  >
  > 1. POST `/api/collections`：鉴权 + 防重复 + 插入 `collections` 表。
  > 2. DELETE `/api/collections`：删除收藏关系。
  > 3. GET `/api/collections/check?prompt_id=&user_id=`：返回 `{ collected: true/false }`。
  > 4. 额外实现 GET `/api/collections/list?user_id=`：返回该用户收藏的所有 prompt 完整信息（join prompts 表）。
  >    - 实现：先查 `collections` 表取 `prompt_id` 列表，再用 `dbQuery('prompts', { id: ... })` 拉取详情。
  >    - 或直接使用 Supabase 的 `select('*, prompts(*)')` 关联查询。
  > 5. 所有接口鉴权，统一错误处理。
  >
  > 请输出完整代码，并对比两种实现方式的优劣。

- **AI 输出摘要**：
  - 生成 `app/api/collections/route.ts`，含 POST、DELETE、GET（check、list）。
  - list 接口使用两步查询：先 collections 取 prompt_id，再 prompts 取详情。
  - 输出对比说明：两步查询更灵活但 N+1 风险，关联查询更高效但需外键约束。

- **对应文件/功能**：`app/api/collections/route.ts`

- **使用技巧说明**：
  - **类比引导**：「仿照点赞 API 的实现」降低上下文成本。
  - **开放式问题**：要求「对比两种实现方式的优劣」引导模型输出方案对比。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 6：AI 对话

#### Prompt #13 — SiliconFlow 流式对话 API

- **Prompt 内容**：
  > 你是 Next.js Streaming 与 AI 集成专家。请实现 `app/api/chat/route.ts`，对接 SiliconFlow（兼容 OpenAI 协议），需求：
  >
  > 1. 鉴权后接收 `{ messages, prompt, conversation_id, save_history }`。
  > 2. 速率限制：每用户 60 秒内最多 8 次，使用模块级 `Map<string, { count, start }>` 实现。
  > 3. 调用 `${SILICONFLOW_BASE_URL}/chat/completions`，model 为 `Qwen/Qwen2.5-7B-Instruct`，`stream: true`，`max_tokens: 2048`，`temperature: 0.7`。
  > 4. 使用 `ReadableStream` 包装上游 SSE 流，逐行解析 `data: ` 前缀，提取 `choices[0].delta.content`。
  > 5. 透传给前端格式：`data: {"response": "<delta>", "done": false}\n\n`，结束时 `data: {"response": "", "done: true}\n\n`。
  > 6. 流结束后若 `save_history !== false`，将完整 user_message + ai_response 写入 `chat_history` 表。
  > 7. 错误处理：上游 429 返回「AI 访问繁忙」，其他错误返回 502。
  > 8. 响应 headers：`Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`。
  > 9. 使用 `runtime = 'nodejs'`。
  >
  > 请输出完整 TypeScript 代码，并说明流式响应中 `controller.close()` 的位置。

- **AI 输出摘要**：
  - 生成 `app/api/chat/route.ts`，含速率限制、SSE 流式解析、历史保存。
  - `ReadableStream` 的 `start(controller)` 中 `while(true)` 循环读取上游 reader。
  - `finally` 块中 `controller.close()`，并异步保存历史。
  - 透传格式按约定。

- **对应文件/功能**：`app/api/chat/route.ts`

- **使用技巧说明**：
  - **角色设定**：「Next.js Streaming 与 AI 集成专家」。
  - **明确约束**：列出 9 项硬性要求，覆盖速率限制、流式协议、错误处理。
  - **细节要求**：要求解释 `controller.close()` 位置，便于人工 review。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #14 — 前端聊天界面与流式渲染

- **Prompt 内容**：
  > 请实现 `app/chat/page.tsx` 与 `components/ChatPanel.tsx`：
  >
  > 1. 顶部输入框 + 发送按钮，底部消息列表。
  > 2. 消息分用户/助手两类，不同背景色与对齐方向。
  > 3. 发送时调用 `/api/chat`，使用 `fetch` + `ReadableStream` 读取 SSE。
  > 4. 解析 `data: {"response": "...", "done": ...}`，逐步追加到当前 AI 消息内容。
  > 5. 支持「停止生成」按钮，通过 `AbortController` 中断 fetch。
  > 6. 历史消息从 `/api/chat/history` 加载，按 conversation_id 分组。
  > 7. 使用 antd `Input.TextArea`、`Button`、`Avatar` 组件。
  > 8. 暗色模式适配，通过 `useThemeContext()` 获取 palette。
  > 9. 自动滚动到底部（`useRef` + `scrollIntoView`）。
  >
  > 请输出两个文件的完整代码，重点说明 SSE 解析逻辑。

- **AI 输出摘要**：
  - 生成 `app/chat/page.tsx`（布局）与 `components/ChatPanel.tsx`（核心逻辑）。
  - SSE 解析：`fetch` 后 `res.body.getReader()` + `TextDecoder` + `chunk.split('\n')` + `JSON.parse`。
  - `AbortController` 通过 `signal` 传入 fetch，停止时 `controller.abort()`。
  - `useRef` 引用底部 div，每次消息更新后 `scrollIntoView({ behavior: 'smooth' })`。

- **对应文件/功能**：`app/chat/page.tsx`、`components/ChatPanel.tsx`

- **使用技巧说明**：
  - **明确约束**：列出 9 项需求覆盖 UI、协议、性能、可访问性。
  - **重点说明要求**：「重点说明 SSE 解析逻辑」便于人工校对核心逻辑。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 7：头像上传

#### Prompt #15 — 头像上传与旧文件清理

- **Prompt 内容**：
  > 请实现 `app/api/profile/route.ts` 的 POST handler（头像上传），需求：
  >
  > 1. 鉴权后使用 `req.formData()` 读取 `avatar` 字段。
  > 2. 校验：MIME 必须为 `image/jpeg`/`image/jpg`/`image/png`/`image/webp`；扩展名必须为 `jpg/jpeg/png/webp`；大小 ≤ 2MB。
  > 3. 文件路径规则：`avatars/${userId}/${timestamp}.${ext}`（jpeg 统一转 jpg）。
  > 4. 调用 `uploadFileToCloud('avatars', filePath, buffer, mimeType)` 上传，`upsert: true`。
  > 5. 调用 `getPublicFileUrl('avatars', filePath)` 获取公开 URL。
  > 6. 查询旧用户记录，若存在 `avatar_path`，调用 `deleteCloudFile('avatars', oldPath)` 清理旧文件（失败仅记日志不阻塞）。
  > 7. 更新 `users` 表：`avatar_url`、`avatar_path`、`updated_at`。
  > 8. 返回 `{ success: true, data: { avatar_url }, message: '头像上传成功' }`。
  > 9. 同文件还需实现 PUT handler（更新昵称/密码），逻辑参考注册/登录的 `hashPassword`。
  > 10. 使用 `runtime = 'nodejs'`。
  >
  > 请输出完整代码。

- **AI 输出摘要**：
  - 生成 `app/api/profile/route.ts`，含 POST（头像）与 PUT（昵称/密码）。
  - 头像上传严格三重校验：MIME、扩展名、大小。
  - 旧文件清理 try-catch 包裹，失败仅 console.error。
  - PUT 中分支处理 nickname 与 old_password/new_password。

- **对应文件/功能**：`app/api/profile/route.ts`

- **使用技巧说明**：
  - **明确约束**：列出 10 项要求覆盖校验、路径、清理、更新。
  - **安全要求**：明确「失败仅记日志不阻塞」避免影响主流程。
  - **细节要求**：「jpeg 统一转 jpg」避免扩展名不一致。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 8：前端页面

#### Prompt #16 — 首页与提示词卡片

- **Prompt 内容**：
  > 请实现 `app/page.tsx`（首页）与 `components/PromptCard.tsx`（提示词卡片），需求：
  >
  > 1. 首页：
  >    - 顶部搜索栏（标题/内容模糊搜索）、标签筛选、可见性筛选。
  >    - 网格布局展示公开 prompts（每行 3 列，响应式）。
  >    - 分页（每页 50 条，使用 antd `Pagination`）。
  >    - 「新建提示词」按钮（未登录时点击弹出 `LoginPopup`）。
  >    - 调用 `/api/prompts?visibility=public&page=...` 拉取数据。
  > 2. PromptCard：
  >    - 顶部 tags（最多 3 个）+ visibility 标签。
  >    - 中部 title + content（4 行截断，`-webkit-line-clamp: 4`）。
  >    - 底部作者头像 + 昵称 + 点赞/收藏/复制按钮。
  >    - hover 时 `translateY(-6px)` + 阴影。
  >    - 点赞/收藏需登录，未登录弹 `LoginPopup`。
  >    - 作者本人可见编辑/删除/版本历史按钮。
  >    - 复制内容到剪贴板（`navigator.clipboard.writeText`）。
  > 3. 使用 `useThemeContext()` 的 palette 适配主题色。
  > 4. 使用 `safeFetch` 统一封装 fetch。
  > 5. 删除成功后调用 `onDelete` 回调或 `window.location.reload()`。
  >
  > 请输出两个文件的完整代码。

- **AI 输出摘要**：
  - 生成 `app/page.tsx` 与 `components/PromptCard.tsx`。
  - PromptCard 使用内联 style 实现 hover 动效（后评审中建议迁移 CSS Modules）。
  - 点赞/收藏通过 `safeFetch` 调用对应 API，成功后更新 local state。
  - 复制使用 `navigator.clipboard.writeText`，失败提示「复制失败，请手动复制」。

- **对应文件/功能**：`app/page.tsx`、`components/PromptCard.tsx`

- **使用技巧说明**：
  - **分步指令**：首页与卡片分别说明，结构清晰。
  - **明确约束**：列出 5 项关键交互（hover、登录守卫、复制、作者按钮、主题适配）。
  - **细节要求**：「4 行截断」指定 `-webkit-line-clamp: 4` 避免模型猜测。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #17 — 登录注册弹窗

- **Prompt 内容**：
  > 请实现 `components/LoginPopup.tsx`，需求：
  >
  > 1. 使用 antd `Modal` 组件，受控 `isOpen` + `onClose`。
  > 2. 内部 Tab 切换：登录 / 注册。
  > 3. 登录表单：邮箱、密码。
  > 4. 注册表单：昵称、邮箱、密码、确认密码。
  > 5. 调用 `useAuth()` 的 `login` / `register`，成功后 `onClose()` 并 `showToast('登录成功', 'success')`。
  > 6. 失败时 `showToast(message, 'error')`。
  > 7. 密码与确认密码不一致时本地校验阻止提交。
  > 8. 暗色模式适配。
  > 9. 表单使用 antd `Form` + `Form.Item` + `Input` + `Button`。
  > 10. 提交时按钮 loading 状态。
  >
  > 请输出完整代码。

- **AI 输出摘要**：
  - 生成 `components/LoginPopup.tsx`，使用 antd `Modal` + `Tabs` + `Form`。
  - 表单字段按要求配置 rules。
  - 提交时 `setLoading(true)`，结束 `setLoading(false)`。
  - 成功后调用 `onClose` 与 `showToast`。

- **对应文件/功能**：`components/LoginPopup.tsx`

- **使用技巧说明**：
  - **明确约束**：10 项要求覆盖组件、交互、校验、样式。
  - **组件库约束**：明确使用 antd v6 组件，避免混用其他库。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #18 — 个人中心页与主题切换

- **Prompt 内容**：
  > 请实现 `app/profile/page.tsx`（个人中心）与 `app/ThemeProvider.tsx`（主题上下文），需求：
  >
  > 1. ThemeProvider：
  >    - 提供 `palette` 对象，包含 `primary`、`success`、`error`、`warning`、`text`、`textSecondary`、`border`、`bg`、`bgSecondary`、`shadow` 等字段。
  >    - 提供 `theme: 'light' | 'dark'` 与 `toggleTheme()`。
  >    - 默认从 `localStorage.getItem('theme')` 读取，未设置则跟随系统 `prefers-color-scheme`。
  >    - 切换时写入 `localStorage` 与 `document.documentElement.dataset.theme`。
  > 2. 个人中心页：
  >    - 左侧：头像（点击触发文件选择）、昵称（点击编辑）、邮箱（只读）。
  >    - 右侧：修改密码表单（旧密码、新密码、确认新密码）。
  >    - 顶部 tab：我的提示词 / 我的收藏 / 我的对话历史。
  >    - 头像上传调用 `updateAvatar(file)`。
  >    - 修改昵称调用 `updateProfile({ nickname })`。
  >    - 修改密码调用 `updatePassword(oldPassword, newPassword)`。
  >    - 未登录时重定向到首页。
  > 3. 使用 antd 组件。
  > 4. 全部样式通过 palette 适配主题。
  >
  > 请输出两个文件的完整代码。

- **AI 输出摘要**：
  - 生成 `app/ThemeProvider.tsx`，含 `ThemeProvider` 与 `useThemeContext`。
  - palette 在 light/dark 两套配色间切换。
  - `app/profile/page.tsx` 使用 antd `Tabs` + `Form` + `Avatar`。
  - 头像通过 `<input type="file" accept="image/*" />` 触发选择。

- **对应文件/功能**：`app/ThemeProvider.tsx`、`app/profile/page.tsx`

- **使用技巧说明**：
  - **明确约束**：palette 字段全列出，避免遗漏。
  - **细节要求**：「跟随系统 prefers-color-scheme」体现工程严谨度。
  - **分步指令**：两个文件分别说明。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 9：部署配置

#### Prompt #19 — Vercel 部署与环境变量

- **Prompt 内容**：
  > 我准备将 Next.js 16 项目部署到 Vercel。请帮我生成：
  >
  > 1. `vercel.json` 配置文件：framework 设为 `nextjs`，构建命令 `next build`，输出目录 `.next`，regions 设为 `hkg1`（香港）。
  > 2. `.env.production` 模板，列出所有需要的环境变量（不含值）。
  > 3. GitHub Actions workflow（`.github/workflows/deploy.yml`）：
  >    - 触发：push 到 main 分支。
  >    - 步骤：checkout → setup Node 20 → npm ci → npm run build。
  >    - 不需要自动部署到 Vercel（通过 Vercel GitHub App 集成）。
  > 4. README 中部署章节的草稿：包含「环境变量配置」「Vercel 导入项目」「自定义域名绑定」3 个小节。
  > 5. 注意：域名 `szy050604.top` 暂未完成实名认证 + DNS 解析，部署章节中线上 Demo 链接部分预留空白，标注「域名完成实名认证+DNS解析后补充完善」。
  >
  > 请输出 4 个文件的内容。

- **AI 输出摘要**：
  - 生成 `vercel.json`：`{"framework": "nextjs", "regions": ["hkg1"]}`。
  - 生成 `.env.production` 模板，列出 6 个环境变量。
  - 生成 GitHub Actions workflow，CI 仅 build 不部署。
  - README 部署章节中线上 Demo 链接部分按要求预留空白。

- **对应文件/功能**：`vercel.json`、`.env.production`、`.github/workflows/deploy.yml`、`README.md`

- **使用技巧说明**：
  - **明确约束**：5 项要求覆盖配置、CI、文档。
  - **项目状态约束**：明确「域名未解析」需预留空白，避免输出虚构链接。
  - **输出格式约束**：要求 4 个文件分别输出，便于复制。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

### 阶段 10：Bug 修复

#### Prompt #20 — 修复水合错误与 localStorage SSR 不一致

- **Prompt 内容**：
  > 我在 Next.js 16 项目中遇到水合错误：`Hydration failed because the initial UI does not match what was rendered on the server`。错误出现在 `app/page.tsx` 顶部导航栏，导航栏根据 `useAuth().user` 判断是否显示「登录」按钮或「头像」下拉。
  >
  > 已知原因：服务端渲染时 `user` 为 `null`（因为 localStorage 不可用），客户端首次渲染时 `user` 仍为 `null`（useEffect 尚未执行），但 localStorage 中已有 token 时第二次渲染 `user` 变为对象，导致水合不匹配。
  >
  > 请提供 2 种修复方案，并说明优劣：
  >
  > 1. 方案 A：使用 `useEffect` + `mounted` state，在 mounted 为 false 时渲染占位符。
  > 2. 方案 B：使用 `next/dynamic` + `{ ssr: false }` 动态导入导航栏组件。
  >
  > 输出每种方案的代码示例，并给出最终推荐方案。

- **AI 输出摘要**：
  - 方案 A：`const [mounted, setMounted] = useState(false)` + `useEffect(() => setMounted(true), [])`，`if (!mounted) return <Placeholder />`。
  - 方案 B：`const Nav = dynamic(() => import('./Nav'), { ssr: false })`。
  - 推荐 A：保留 SSR 优势，仅对受影响组件占位。

- **对应文件/功能**：`app/page.tsx` 顶部导航栏

- **使用技巧说明**：
  - **上下文提供**：完整描述错误信息与根因，避免模型猜测。
  - **开放式问题**：要求 2 种方案对比，引导模型输出方案选型。
  - **明确要求**：要求「最终推荐方案」便于直接落地。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

#### Prompt #21 — 修复头像上传 CORS 与 Cookie 丢失

- **Prompt 内容**：
  > 我在 `app/api/profile/route.ts` 的 POST（头像上传）接口遇到 2 个问题：
  >
  > 1. 前端通过 `FormData` 上传时，浏览器先发 OPTIONS 预检，返回 204 但缺少 `Access-Control-Allow-Headers`，导致后续 POST 失败。
  > 2. 上传时前端未在 headers 中带 `Content-Type: multipart/form-data`（应让浏览器自动设置），但前端代码错误地手动设置了 `Content-Type: application/json`，导致服务端 `req.formData()` 解析失败。
  > 3. 部分情况下 Authorization 头丢失，怀疑是 fetch 未带 cookie。
  >
  > 请：
  > 1. 检查 `handleOptions()` 函数是否覆盖了 `multipart/form-data`。
  > 2. 给出前端 `updateAvatar` 的正确 fetch 写法（不要手动设 Content-Type）。
  > 3. 说明 token 是通过 Authorization 头传递的，与 cookie 无关，无需 `credentials: 'include'`。
  > 4. 输出修复后的 `handleOptions` 与前端 `updateAvatar` 代码。

- **AI 输出摘要**：
  - `handleOptions` 已包含 `Access-Control-Allow-Headers: Content-Type, Authorization`，但 Content-Type 应允许浏览器自动设置的 `multipart/form-data; boundary=...`，由于值为通配 `Content-Type`，已覆盖。
  - 前端 `updateAvatar` 应使用 `FormData`，headers 仅注入 `Authorization`，**不要**手动设 `Content-Type`。
  - 解释 token 通过 Authorization 头传递，fetch 默认同源即可。

- **对应文件/功能**：`lib/supabase-server.ts`（handleOptions）、`lib/auth.tsx`（updateAvatar）

- **使用技巧说明**：
  - **上下文提供**：完整描述 3 个症状，便于模型定位根因。
  - **明确要求**：列出 4 项修复点。
  - **原理说明要求**：要求解释「为何不需要 credentials: 'include'」，便于沉淀知识。

- **AI 输出截图**：
  > [在此粘贴 Cursor AI 返回代码/结果的截图，或插入图片链接]
  > ![AI输出截图](#)

---

## 三、Prompt 工程技巧总结

### 3.1 高效 Prompt 模板

经 21 条 Prompt 实战验证，以下模板效果最佳：

```
[角色设定] + [上下文提供] + [明确约束] + [输出格式] + [分步指令]
```

### 3.2 关键技巧清单

| 技巧 | 作用 | 示例 |
| --- | --- | --- |
| 角色设定 | 引导模型调用领域专家知识 | 「你是一位 Next.js 安全专家」 |
| 明确技术要求 | 避免模型选择弱方案 | 「使用 pbkdf2Sync，迭代 100000 次」 |
| 输出格式约束 | 便于直接落地 | 「JSON 格式输出，不要多余解释」 |
| 分步指令 | 降低理解负担 | 「1. ... 2. ... 3. ...」 |
| 上下文提供 | 保持一致性 | 「基于上一条注册 API 的实现」 |
| 示例驱动 | 对齐期望风格 | 给出期望的 JSON 响应结构 |
| 开放式问题 | 引导方案对比 | 「对比两种实现方式的优劣」 |
| 原理说明要求 | 沉淀知识 | 「说明 controller.close() 的位置」 |
| 项目状态约束 | 避免虚构 | 「域名未解析，预留空白」 |

### 3.3 常见反模式

- ❌ 过于宽泛：「帮我写个登录功能」（缺少技术栈、字段、安全要求）
- ❌ 一次问太多：「帮我实现整个项目」（拆分阶段）
- ❌ 不给上下文：「修复这个 bug」（无错误信息、无代码片段）
- ❌ 不约束输出：「随便写」（模型可能输出 markdown / 伪代码 / 多语言混合）

### 3.4 多轮迭代模式

复杂功能采用多轮对话：

1. 第 1 轮：生成首版代码（覆盖主流程）
2. 第 2 轮：指出问题 + 给出修复方向 + 要求重新生成
3. 第 3 轮：要求补充边界处理、错误处理、注释

本项目 `app/api/prompts/route.ts` 的权限分支逻辑即经过 3 轮迭代才完整覆盖 5 种 query 组合。

---

## 四、附录

### 4.1 项目当前状态

- **代码托管**：项目代码已推送 GitHub。
- **本地验证**：`localhost:3000` 全部功能实现并验证通过。
- **线上 Demo**：域名 `szy050604.top` 完成实名认证 + DNS 解析后补充完善。

### 4.2 在线 Demo 链接

> 域名完成实名认证 + DNS 解析后补充完善以下内容：

- 线上访问地址：`https://szy050604.top`（待解析后填入）
- 在线 Demo 演示视频：（待录制）
- 部署日志截图：（待补充）

### 4.3 Cursor AI 使用统计

| 指标 | 数值 |
| --- | --- |
| 总 Prompt 数 | 21 |
| 覆盖开发阶段 | 10 |
| 平均每条 Prompt 字数 | 约 300 字 |
| 多轮对话轮次 | 约 35 轮（含迭代） |
| AI 生成代码占比（估算） | 约 70% |
| 人工 review 与修改占比 | 约 30% |

### 4.4 复盘

- **AI 擅长**：模板代码生成（CRUD、表单、API handler）、流式协议实现、错误处理框架。
- **AI 弱项**：复杂权限分支（需多轮迭代）、命名规范（需人工 review 剔除 `tcb` 等遗留词）、安全细节（如时序攻击、密钥回退值需人工指出）。
- **结论**：AI 工具显著提升开发效率（7 天完成全栈项目），但人工 review 不可或缺，尤其在安全与约束规则层面。

---

> 本文档作为 Prompt Workshop 项目 AI 工具运用分值的核心支撑材料，记录了开发全过程使用的 21 条 Prompt，覆盖环境搭建、数据库设计、认证系统、提示词 CRUD、点赞收藏、AI 对话、头像上传、前端页面、部署配置、Bug 修复 10 个阶段。项目代码已推送 GitHub，本地功能全部实现，唯一缺失为线上 Demo 链接（域名完成实名认证 + DNS 解析后补充完善）。
