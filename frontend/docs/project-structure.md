# Prompt Workshop 项目目录结构文档

> 本文档描述 `frontend/` 目录的完整结构、每个文件 / 目录的职责，以及 Next.js 16 App Router 工程规范下的分层架构设计。

> 📌 **交付状态备注**：项目代码已全部推送至 GitHub 公开仓库，本地 `localhost:3000` 环境下全部业务功能开发完毕并自测通过；唯一缺失交付物为线上 Demo 访问链接（详见 README.md「部署说明」章节）。

> 📌 **技术栈备注**：本项目**不使用任何腾讯云相关技术**（无 TCB、无 CloudBase、无云开发），所有数据存储与对象存储统一使用 Supabase（PostgreSQL + Storage）。

---

## 一、完整树形目录结构

> 已忽略 `node_modules/`、`.next/`、`.git/`、`.vercel/` 等自动生成目录。

```
frontend/
├── app/                              # Next.js App Router 应用入口（前后端同构）
│   ├── ai-workspace/                 # AI 工作台页面目录
│   │   └── page.tsx                  #   AI 对话页面（流式输出 + 历史回放）
│   ├── api/                          # 后端 Route Handler 接口目录
│   │   ├── chat/                      #   AI 对话接口
│   │   │   └── route.ts              #     POST：调用 SiliconFlow Qwen2.5-7B 流式对话
│   │   ├── chat-history/             #   对话历史接口
│   │   │   └── route.ts              #     GET：查询当前用户对话历史
│   │   ├── collections/              #   收藏管理接口
│   │   │   ├── check/                #     收藏状态检查
│   │   │   │   └── route.ts           #       GET：查询当前用户对某 prompt 的收藏状态
│   │   │   └── route.ts              #     GET/POST/DELETE：收藏列表 / 收藏 / 取消收藏
│   │   ├── likes/                    #   点赞管理接口
│   │   │   ├── check/                #     点赞状态检查
│   │   │   │   └── route.ts           #       GET：查询当前用户对某 prompt 的点赞状态
│   │   │   └── route.ts              #     GET/POST/DELETE：点赞列表 / 点赞 / 取消点赞
│   │   ├── login/                    #   登录接口
│   │   │   └── route.ts              #     POST：校验密码并签发 JWT Cookie
│   │   ├── profile/                  #   用户资料接口
│   │   │   └── route.ts              #     GET/PUT：获取 / 更新资料（昵称、头像 URL）
│   │   ├── prompts/                  #   提示词管理接口
│   │   │   ├── [id]/                 #     动态路由：基于 prompt id
│   │   │   │   ├── history/          #       历史快照
│   │   │   │   │   └── route.ts      #         GET：获取某提示词编辑历史
│   │   │   │   └── route.ts          #       GET/PUT/DELETE：详情 / 更新 / 删除
│   │   │   └── route.ts              #     GET/POST：列表查询 / 新建
│   │   ├── signup/                   #   注册接口
│   │   │   └── route.ts              #     POST：用户注册（密码加盐哈希存储）
│   │   ├── templates/                #   模板接口
│   │   │   └── route.ts              #     GET：获取模板库列表
│   │   └── users/                    #   用户辅助接口
│   │       ├── ranking/              #     用户排行
│   │       │   └── route.ts          #       GET：活跃用户排行榜
│   │       └── stats/                #     用户统计
│   │           └── route.ts          #       GET：当前用户的提示词 / 点赞 / 收藏数
│   ├── collection/                   # 我的收藏页面目录
│   │   └── page.tsx                  #   展示当前用户收藏的提示词列表
│   ├── forum/                        # 公共论坛页面目录
│   │   └── page.tsx                  #   聚合所有公开提示词，支持搜索
│   ├── login/                        # 登录页面目录
│   │   └── page.tsx                  #   登录表单页面
│   ├── profile/                      # 个人中心页面目录
│   │   └── page.tsx                  #   资料展示、昵称修改、头像上传
│   ├── prompt/                       # 我的提示词页面目录
│   │   └── page.tsx                  #   个人提示词管理（CRUD 入口）
│   ├── register/                     # 注册页面目录
│   │   └── page.tsx                  #   注册表单页面
│   ├── templates/                    # 模板库页面目录
│   │   └── page.tsx                  #   模板浏览与一键创建
│   ├── ThemeProvider.tsx             # 主题上下文 Provider（5 套马卡龙主题）
│   ├── ThemeToggle.tsx               # 主题切换组件（页面级）
│   ├── useTheme.ts                   # 主题 Hook（app 层快捷引用）
│   ├── theme.ts                      # 主题常量与定义（app 层快捷引用）
│   ├── favicon.ico                   # 站点图标
│   ├── globals.css                   # 全局样式（含 Tailwind 引入）
│   ├── layout.tsx                    # 根布局：注入 ThemeProvider、AuthProvider、AntdRegistry
│   ├── not-found.tsx                 # 自定义 404 页面
│   └── page.tsx                      # 首页：登录态判断 + 路由跳转
├── components/                       # 业务可复用组件层
│   ├── ConfirmModal.tsx              # 二次确认弹窗
│   ├── Empty.tsx                     # 空状态占位
│   ├── HistoryModal.tsx              # 提示词编辑历史弹窗
│   ├── LoginPopup.tsx                # 未登录操作时弹出的登录提示
│   ├── Modal.tsx                     # 通用模态框基础组件
│   ├── PromptCard.tsx                # 提示词卡片（点赞 / 收藏 / 编辑 / 删除入口）
│   ├── PromptForm.tsx                # 提示词表单（新建 / 编辑共用）
│   ├── Skeleton.tsx                  # 骨架屏加载占位
│   ├── ThemeToggle.tsx               # 主题切换按钮（组件层）
│   └── Toast.tsx                     # 消息提示 Toast
├── hooks/                            # 自定义 React Hooks 层
│   └── useTheme.ts                   # 主题切换 Hook（封装 Context 读写）
├── lib/                              # 工具库 / 服务端逻辑层
│   ├── api/                          # 前端接口请求封装
│   │   └── prompts.ts                #   提示词相关 fetch 封装
│   ├── supabase/                     # 三层 Supabase 客户端（按运行环境分层）
│   │   ├── admin.ts                  #   服务端管理客户端（service_role Key，绕过 RLS）
│   │   ├── client.ts                 #   浏览器客户端（anon Key，配合 SSR Cookie）
│   │   └── server.ts                 #   服务端客户端（SSR Cookie 读写）
│   ├── auth.tsx                      # 认证上下文：JWT 解析、登录态、用户信息
│   ├── supabase-server.ts            # 旧版服务端封装（兼容保留）
│   ├── supabase.ts                   # 旧版通用封装（兼容保留）
│   ├── theme.ts                      # 主题常量、色板、CSS 变量映射
│   └── utils.ts                      # 通用工具函数（密码哈希、格式化、cn 等）
├── types/                            # 全局 TypeScript 类型定义层
│   ├── like.ts                       #   点赞相关类型
│   ├── prompt.ts                     #   提示词、历史、模板相关类型
│   └── user.ts                       #   用户、登录态相关类型
├── public/                           # 静态资源目录（直接对外提供）
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── scripts/                          # 运维 / 一次性脚本
│   └── check-supabase.mjs            #   Supabase 连通性与表结构检查脚本
├── supabase/                         # 数据库相关资源
│   ├── cors-policy.json              #   Storage CORS 策略参考
│   └── schema.sql                    #   建表、索引、RLS、示例数据 SQL
├── tests/                            # 测试目录
│   └── run-tests.mjs                 #   内置 Node 测试脚本（被 npm test 调用）
├── .gitignore                        # Git 忽略规则
├── AGENTS.md                         # AI Agent 协作指引
├── CLAUDE.md                         # Claude 模型协作指引
├── README.md                         # 项目主文档
├── eslint.config.mjs                 # ESLint 配置（Flat Config）
├── middleware.ts                     # Next.js 中间件（matcher：非 api/_next 路由）
├── next-env.d.ts                     # Next.js 环境类型声明
├── next.config.ts                    # Next.js 配置：图片远程域名、CORS、Body 上限
├── package-lock.json                 # 依赖版本锁
├── package.json                      # 依赖清单与 npm scripts
├── postcss.config.mjs                # PostCSS 配置（接入 TailwindCSS 4）
├── tsconfig.json                     # TypeScript 编译配置
├── tsconfig.tsbuildinfo              # TypeScript 增量编译缓存
└── vercel.json                       # Vercel 部署配置（框架、构建命令、CORS 头）
```

---

## 二、分层架构说明

本项目严格遵循 Next.js 16 App Router 工程规范，采用「前后端同构 + 分层解耦」的架构。整体可划分为 **五大分层**：

### 2.1 `lib/supabase` 三层客户端（数据访问层）

针对 Supabase 在不同运行环境下的差异，将客户端拆为三层，对应官方 `@supabase/ssr` 推荐模式：

| 文件 | 运行环境 | Key 类型 | 用途 |
| --- | --- | --- | --- |
| `lib/supabase/client.ts` | 浏览器（Client Component） | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 创建浏览器端 Supabase 客户端，配合 SSR Cookie 透传会话 |
| `lib/supabase/server.ts` | 服务端（Route Handler / Server Component） | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 创建服务端 Supabase 客户端，自动读写 Cookie，用于 SSR 渲染与受 RLS 保护的查询 |
| `lib/supabase/admin.ts` | 服务端（受信接口） | `SUPABASE_SERVICE_ROLE_KEY` | 创建管理客户端，**绕过 RLS**，用于本项目自实现 JWT 鉴权下的用户表 / 提示词表写入 |

设计要点：
- 三层客户端共享同一 Supabase 项目，但权限边界清晰。
- 浏览器层仅持有 `anon key`，受 RLS 约束。
- 服务端业务接口通过 `admin.ts` 直接操作数据表（因项目使用自实现 JWT 而非 Supabase Auth）。
- `lib/supabase.ts` 与 `lib/supabase-server.ts` 为旧版兼容封装，逐步迁移至 `lib/supabase/*` 三层结构。

### 2.2 `app/api` 后端接口层（业务逻辑层）

所有后端接口以 Next.js Route Handler 形式实现，文件名固定为 `route.ts`，路径即接口路径。

按业务领域划分：

- **认证域**：`api/signup`、`api/login`、`api/profile`
- **提示词域**：`api/prompts`、`api/prompts/[id]`、`api/prompts/[id]/history`
- **互动域**：`api/likes`、`api/likes/check`、`api/collections`、`api/collections/check`
- **AI 域**：`api/chat`、`api/chat-history`
- **辅助域**：`api/templates`、`api/users/stats`、`api/users/ranking`

特性：
- 所有 `/api/*` 路由通过 `next.config.ts` 的 `headers()` 与 `vercel.json` 的 `headers` 统一注入 CORS（`Access-Control-Allow-Origin: *` 等）。
- JWT 鉴权在每个路由内自行解析 Cookie 中的 Token，校验失败返回 401。
- 动态路由使用 `[id]` 形式（如 `api/prompts/[id]`），嵌套子资源使用目录嵌套（如 `api/prompts/[id]/history`）。
- AI 接口基于 `ReadableStream` 实现流式响应，配合 SiliconFlow OpenAI 兼容协议。

### 2.3 `app` 前端页面层（UI 路由层）

按 Next.js App Router 规范，每个目录下的 `page.tsx` 对应一个路由：

| 路由路径 | 页面文件 | 功能 |
| --- | --- | --- |
| `/` | `app/page.tsx` | 首页（登录态判断与跳转） |
| `/login` | `app/login/page.tsx` | 登录页 |
| `/register` | `app/register/page.tsx` | 注册页 |
| `/prompt` | `app/prompt/page.tsx` | 我的提示词（个人 CRUD） |
| `/forum` | `app/forum/page.tsx` | 公共论坛（浏览公开提示词） |
| `/collection` | `app/collection/page.tsx` | 我的收藏 |
| `/profile` | `app/profile/page.tsx` | 个人中心（资料、头像） |
| `/ai-workspace` | `app/ai-workspace/page.tsx` | AI 工作台（流式对话） |
| `/templates` | `app/templates/page.tsx` | 模板库 |

全局文件：
- `app/layout.tsx`：根布局，注入 `ThemeProvider`、`AuthProvider`、AntdRegistry，定义全局 HTML 骨架。
- `app/globals.css`：全局样式，引入 TailwindCSS 与自定义 CSS 变量。
- `app/ThemeProvider.tsx`：主题上下文 Provider，将选中主题写入 Cookie 持久化。
- `app/not-found.tsx`：自定义 404 友好页面。

### 2.4 `components` 组件层（UI 复用层）

业务可复用组件统一存放于 `components/`，与 `app/` 页面解耦，便于跨页面复用：

| 组件 | 职责 |
| --- | --- |
| `PromptCard.tsx` | 提示词卡片：展示标题 / 标签 / 内容预览，集成点赞、收藏、编辑、删除入口 |
| `PromptForm.tsx` | 提示词表单：新建与编辑共用，含标签输入、可见性切换 |
| `Modal.tsx` | 通用模态框基础组件，承载弹窗动画与遮罩 |
| `ConfirmModal.tsx` | 二次确认弹窗，用于删除等危险操作 |
| `HistoryModal.tsx` | 提示词编辑历史展示弹窗 |
| `LoginPopup.tsx` | 未登录场景下触发的登录引导弹窗 |
| `Toast.tsx` | 全局消息提示（成功 / 错误 / 警告） |
| `Skeleton.tsx` | 列表与卡片加载骨架屏 |
| `Empty.tsx` | 空状态占位 |
| `ThemeToggle.tsx` | 主题切换按钮（与 `app/ThemeToggle.tsx` 配合） |

### 2.5 `types` 类型定义层（契约层）

集中定义前后端共享的 TypeScript 类型契约，避免 magic string 与隐式 any：

| 文件 | 内容 |
| --- | --- |
| `types/user.ts` | `User`、`LoginState`、`AuthContext` 等用户与认证相关类型 |
| `types/prompt.ts` | `Prompt`、`PromptHistory`、`Template` 等提示词与模板相关类型 |
| `types/like.ts` | `Like`、`Collection` 等互动相关类型 |

---

## 三、Next.js App Router 工程规范遵循情况

本项目严格遵循 Next.js 16 App Router 推荐工程规范：

### 3.1 文件约定
- ✅ 使用 `app/` 目录而非 `pages/` 目录。
- ✅ 页面统一以 `page.tsx` 命名。
- ✅ 接口统一以 `route.ts` 命名（Route Handler），导出 `GET` / `POST` / `PUT` / `DELETE` 等命名导出。
- ✅ 布局以 `layout.tsx` 命名，作为根布局包裹所有页面。
- ✅ 全局样式集中于 `app/globals.css`，通过 `layout.tsx` 引入。
- ✅ 404 页面以 `app/not-found.tsx` 实现。
- ✅ 动态路由使用 `[id]` 方括号目录语法。
- ✅ 嵌套路由通过目录嵌套表达资源层级（`prompts/[id]/history`）。

### 3.2 Server / Client Component 边界
- ✅ 服务端逻辑（数据查询、鉴权、AI 调用）放在 `app/api/*/route.ts` 中。
- ✅ 需要状态与浏览器 API 的组件使用 `'use client'` 指令（如 `lib/supabase/client.ts`、`lib/auth.tsx`）。
- ✅ Supabase 客户端按运行环境分为 `client.ts`（浏览器）、`server.ts`（SSR）、`admin.ts`（服务端管理）。

### 3.3 配置约定
- ✅ `next.config.ts` 使用 TypeScript 形式，配置 `images.remotePatterns`（Supabase Storage 域名）、`experimental.serverActions.bodySizeLimit`（2MB）、`headers()`（CORS）。
- ✅ `vercel.json` 声明 `framework: nextjs`、构建命令、输出目录、CORS 头。
- ✅ `tsconfig.json` 遵循 Next.js 默认推荐配置。
- ✅ `eslint.config.mjs` 采用 ESLint 9 Flat Config + `eslint-config-next`。
- ✅ `postcss.config.mjs` 接入 `@tailwindcss/postcss`，启用 TailwindCSS 4。

### 3.4 中间件
- `middleware.ts` 当前 matcher 为 `['/((?!api|_next/static|_next/image|favicon.ico).*)']`，即对非 API、非静态资源生效；当前实现为透传 `NextResponse.next()`，预留扩展位（如未来在边缘层做登录态拦截）。

---

## 四、数据流与调用关系

```
浏览器
  │
  │ 1. 渲染页面（app/**/page.tsx）
  │    └─ 使用 components/* 与 hooks/useTheme
  │    └─ 通过 lib/auth.tsx 读取登录态
  │
  │ 2. 发起请求
  ▼
app/api/**/route.ts  ────────────────►  SiliconFlow API
  │   ├─ 解析 JWT Cookie                  （Qwen2.5-7B-Instruct）
  │   ├─ 通过 lib/supabase/admin.ts      流式响应回传
  │   │   写入 PostgreSQL 表
  │   └─ 通过 lib/supabase/server.ts
  │       读取受 RLS 保护的数据
  ▼
Supabase（PostgreSQL + Storage）
  ├─ public.users
  ├─ public.prompts
  ├─ public.prompt_history
  ├─ public.likes
  ├─ public.collections
  ├─ public.chat_history
  ├─ public.templates
  └─ storage.buckets.avatars（头像）
```

---

## 五、目录职责速查表

| 目录 / 文件 | 职责 | 是否含业务逻辑 |
| --- | --- | --- |
| `app/` | 前端页面 + 后端 Route Handler | ✅ |
| `app/api/` | 后端接口层 | ✅ |
| `app/{route}/page.tsx` | 页面 UI | ✅ |
| `app/layout.tsx` | 全局布局 | ✅ |
| `components/` | 业务可复用 UI 组件 | ✅ |
| `hooks/` | 自定义 React Hooks | ✅ |
| `lib/` | 工具库与服务端逻辑 | ✅ |
| `lib/supabase/` | 三层 Supabase 客户端 | ✅ |
| `lib/api/` | 前端 fetch 封装 | ✅ |
| `types/` | TypeScript 类型契约 | ❌（纯类型） |
| `public/` | 静态资源 | ❌ |
| `scripts/` | 一次性运维脚本 | ⚠️（运维） |
| `supabase/` | 数据库 SQL 与策略 | ⚠️（DDL） |
| `tests/` | 自动化测试脚本 | ⚠️（测试） |
| `middleware.ts` | Next.js 边缘中间件 | ⚠️（透传） |
| `next.config.ts` | 框架配置 | ❌ |
| `vercel.json` | 部署配置 | ❌ |
| `tsconfig.json` | TS 编译配置 | ❌ |
| `eslint.config.mjs` | 代码检查配置 | ❌ |
| `postcss.config.mjs` | PostCSS / Tailwind 配置 | ❌ |
| `package.json` | 依赖与脚本 | ❌ |

---

## 六、备注

1. **本项目不使用任何腾讯云技术**（无 TCB / CloudBase / 云开发），全部数据存储使用 Supabase。
2. **项目代码已推送至 GitHub 公开仓库**，本地 `localhost:3000` 环境下全部业务功能（用户注册 / 登录 JWT 鉴权、头像上传校验与旧文件清理、提示词 CRUD 与历史快照、点赞收藏、AI 流式对话 + 历史持久化、模板库）开发完毕并自测通过。
3. **唯一缺失交付物**：线上 Demo 访问链接。因自定义域名 `szy050604.top` 未完成实名认证与 DNS 解析，暂未生成线上部署 URL；待域名解锁后补充 Vercel 部署链接与线上 CORS / Auth 配置。相关章节详见 `README.md`「部署说明」。
