# Prompt Workshop - AI 提示词管理工作台

> 一个基于 Next.js 16 App Router 全栈架构的 AI 提示词管理平台，支持提示词的创建、分享、收藏、点赞以及与 SiliconFlow AI（Qwen2.5-7B-Instruct）的流式对话。

> 📌 **交付状态说明**：项目代码已全部推送至 GitHub 公开仓库，本地 `localhost:3000` 环境下所有业务功能（认证、头像、提示词 CRUD、点赞收藏、AI 对话、模板库）均已开发完毕并自测通过；唯一缺失交付物为线上 Demo 访问链接，详见 [部署说明](#-部署说明) 章节。

---

## 一、项目简介

Prompt Workshop 是一个面向单人实训场景的 AI 提示词管理工作台。项目以「Prompt 驱动开发」为方法论，使用 Cursor AI 编程工具完成全栈实现。平台围绕「提示词」这一核心资产，提供从创作、组织、分享到 AI 辅助调试的完整闭环：

- **个人提示词库**：支持私密/公开两种可见性，便于管理自用与对外分享。
- **公共论坛**：聚合所有公开提示词，支持关键词与标签搜索，促进优质内容沉淀。
- **点赞与收藏**：轻量化的社交反馈机制，便于标记优质内容。
- **AI 工作台**：基于 SiliconFlow 的 Qwen/Qwen2.5-7B-Instruct 模型，支持流式对话与对话历史持久化。
- **模板库**：内置文案润色、代码审查、翻译等开箱即用的提示词模板。
- **响应式 UI**：基于 Ant Design 6 + TailwindCSS 4 构建，支持 5 套马卡龙色系主题切换。

技术栈严格遵循 Next.js 16 App Router 工程规范，前后端同构，后端 API 全部以 Route Handler 形式实现，部署目标为 Vercel。

---

## 二、技术栈说明

| 分层 | 技术选型 | 版本 / 说明 |
| --- | --- | --- |
| 前端框架 | Next.js (App Router) | 16.2.10 |
| UI 库 | React + React-DOM | 19.2.4 |
| 组件库 | Ant Design | 6.5.1 |
| 样式方案 | TailwindCSS | 4.x（通过 `@tailwindcss/postcss`） |
| 编程语言 | TypeScript | 5.x |
| 数据库 / 存储 | Supabase（PostgreSQL + Storage） | `@supabase/supabase-js` 2.110.7、`@supabase/ssr` 0.12.3 |
| AI 模型服务 | SiliconFlow SiliconFlow | 模型 ID：`Qwen/Qwen2.5-7B-Instruct` |
| 鉴权方案 | 自实现 JWT（HMAC-SHA256） | 通过 `JWT_SECRET` 签发，Cookie 下发 |
| 部署平台 | Vercel | Next.js 原生集成 |
| 测试与构建 | ESLint 9、tsc、内置 Node 测试脚本 | `npm run lint` / `npm run typecheck` / `npm test` |
| 开发工具 | Cursor（Prompt 驱动开发） | 单人实训项目 |

---

## 三、功能特性列表

### 1. 用户认证
- 注册（邮箱 + 密码，密码加盐 SHA-256 存储）
- 登录签发 JWT，写入 HttpOnly Cookie
- 路由级与接口级鉴权拦截
- 退出登录清除会话

### 2. 用户资料与头像
- 修改昵称、查看个人资料
- 头像上传至 Supabase Storage `avatars` Bucket
- 上传时进行格式校验（图片类型）与大小校验
- 更新头像时自动清理旧头像文件，避免存储浪费

### 3. 提示词管理（CRUD）
- 创建提示词（标题、内容、标签数组、可见性）
- 编辑提示词，每次编辑生成 `prompt_history` 历史快照，支持回溯
- 删除提示词（级联删除其历史、点赞、收藏）
- 私密 / 公开两种可见性切换

### 4. 点赞与收藏
- 对任意提示词点赞 / 取消点赞（`likes` 表，唯一约束防重复）
- 收藏提示词至个人收藏夹（`collections` 表）
- 接口均提供 `check` 子路由用于查询当前用户对某提示词的状态
- 提示词表维护 `likes_count` 冗余字段以加速展示

### 5. AI 流式对话
- 基于 SiliconFlow OpenAI 兼容接口调用 `Qwen/Qwen2.5-7B-Instruct`
- 响应通过 `ReadableStream` 流式返回前端
- 对话记录持久化至 `chat_history` 表
- 历史对话列表查看与回放

### 6. 模板库
- 内置文案润色、代码审查、翻译等模板
- 一键基于模板创建提示词
- 模板存储于 `templates` 表，支持分类、标签、描述

### 7. 社区辅助功能
- 用户活跃排行榜（`/api/users/ranking`）
- 用户统计数据（`/api/users/stats`）
- 公共论坛聚合公开提示词，支持搜索

### 8. 体验优化
- 响应式布局，适配桌面 / 平板 / 移动端
- 5 套马卡龙色系主题（`ThemeProvider` + Cookie 持久化）
- Skeleton 骨架屏、Toast 提示、ConfirmModal 二次确认
- 404 友好页面（`not-found.tsx`）

---

## 四、本地环境安装启动步骤

### 4.1 环境要求
- Node.js ≥ 20.x
- npm ≥ 10.x
- 一个可访问的 Supabase 项目（[https://supabase.com](https://supabase.com) 免费创建）
- 一个 SiliconFlow API Key（[https://siliconflow.cn](https://siliconflow.cn) 申请）

### 4.2 克隆仓库

```bash
git clone <your-github-repo-url> prompt-workshop
cd prompt-workshop/frontend
```

> 项目代码已推送至 GitHub 公开仓库，可直接克隆获取。

### 4.3 安装依赖

```bash
cd frontend
npm install
```

### 4.4 配置环境变量

在 `frontend/` 目录下创建 `.env.local` 文件，按 [环境变量说明](#八环境变量说明) 表格填入真实值。

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JWT_SECRET=<your-jwt-secret>
SILICONFLOW_API_KEY=<your-siliconflow-api-key>
FREE_MODEL_ID=Qwen/Qwen2.5-7B-Instruct
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.5 执行建表 SQL

1. 登录 Supabase 控制台，进入对应项目。
2. 打开 **SQL Editor**。
3. 复制 `frontend/supabase/schema.sql` 全部内容并执行。
4. 脚本将自动创建 `users`、`prompts`、`prompt_history`、`likes`、`collections`、`chat_history`、`templates` 等表，建立索引、启用 RLS、初始化示例模板数据，并尝试创建 `avatars` Storage Bucket。
5. 若 `avatars` Bucket 未自动创建，请在 **Dashboard → Storage** 中手动新建名为 `avatars` 的 **public** bucket。

### 4.6 启动开发服务器

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000) 即可使用。

### 4.7 构建生产版本

```bash
npm run build
npm run start
```

---

## 五、依赖清单

以下依赖提取自 `frontend/package.json`：

### dependencies（运行时依赖）
| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| `next` | 16.2.10 | Next.js 框架核心 |
| `react` | 19.2.4 | React 运行时 |
| `react-dom` | 19.2.4 | React DOM 渲染 |
| `antd` | ^6.5.1 | Ant Design 组件库 |
| `@supabase/ssr` | ^0.12.3 | Supabase SSR 客户端（支持 Cookie） |
| `@supabase/supabase-js` | ^2.110.7 | Supabase JS SDK |
| `ws` | ^8.21.1 | WebSocket 工具（用于 SiliconFlow 流式响应中转） |

### devDependencies（开发依赖）
| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| `typescript` | ^5 | TypeScript 编译器 |
| `@types/node` | ^20 | Node.js 类型 |
| `@types/react` | ^19 | React 类型 |
| `@types/react-dom` | ^19 | React DOM 类型 |
| `tailwindcss` | ^4 | TailwindCSS 核心 |
| `@tailwindcss/postcss` | ^4 | TailwindCSS PostCSS 插件 |
| `eslint` | ^9 | 代码检查 |
| `eslint-config-next` | 16.2.10 | Next.js 推荐规则集 |

### npm scripts
| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器（http://localhost:3000） |
| `npm run build` | 生产构建 |
| `npm run start` | 以生产模式启动 |
| `npm run lint` | ESLint 代码检查 |
| `npm run typecheck` | TypeScript 类型检查（`tsc --noEmit`） |
| `npm test` | 运行内置测试脚本（`tests/run-tests.mjs`） |
| `npm run test:local` | 后台启动 dev 后运行测试 |

---

## 六、接口总览

所有后端接口均位于 `app/api/` 下，遵循 Next.js Route Handler 规范。所有 `/api/*` 路由通过 `next.config.ts` 与 `vercel.json` 统一注入 CORS 头。

### 6.1 用户认证
| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/api/signup` | POST | 用户注册（邮箱、密码、昵称），密码加盐哈希存储 |
| `/api/login` | POST | 用户登录校验，签发 JWT 写入 HttpOnly Cookie |
| `/api/profile` | GET | 获取当前登录用户资料 |
| `/api/profile` | PUT | 更新昵称 / 头像 URL |

### 6.2 提示词管理
| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/api/prompts` | GET | 查询提示词列表（支持按作者、可见性、关键词过滤） |
| `/api/prompts` | POST | 新建提示词 |
| `/api/prompts/[id]` | GET | 获取单条提示词详情 |
| `/api/prompts/[id]` | PUT | 更新提示词，自动写入 `prompt_history` 历史快照 |
| `/api/prompts/[id]` | DELETE | 删除提示词（级联删除历史、点赞、收藏） |
| `/api/prompts/[id]/history` | GET | 获取某提示词的编辑历史列表 |

### 6.3 点赞
| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/api/likes` | GET | 查询点赞列表 |
| `/api/likes` | POST | 对提示词点赞 |
| `/api/likes` | DELETE | 取消点赞 |
| `/api/likes/check` | GET | 查询当前用户对指定 prompt 的点赞状态 |

### 6.4 收藏
| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/api/collections` | GET | 查询当前用户的收藏列表 |
| `/api/collections` | POST | 收藏提示词 |
| `/api/collections` | DELETE | 取消收藏 |
| `/api/collections/check` | GET | 查询当前用户对指定 prompt 的收藏状态 |

### 6.5 AI 对话
| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/api/chat` | POST | 调用 SiliconFlow Qwen2.5-7B-Instruct 进行流式对话，对话记录写入 `chat_history` |
| `/api/chat-history` | GET | 获取当前用户的对话历史列表 |

### 6.6 模板与统计
| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/api/templates` | GET | 获取提示词模板列表 |
| `/api/users/stats` | GET | 获取当前用户的统计数据（提示词数、点赞数、收藏数等） |
| `/api/users/ranking` | GET | 获取用户活跃排行榜 |

---

## 七、本地自测流程

### 7.1 启动开发服务器并自测

```bash
# 1. 确认 .env.local 已正确配置
# 2. 启动开发服务器
npm run dev

# 3. 新开终端运行测试
npm test
```

### 7.2 一次性本地自测

```bash
npm run test:local
```

该命令会后台启动 `npm run dev`，等待 5 秒后执行 `tests/run-tests.mjs`。

### 7.3 代码质量检查

```bash
npm run lint        # ESLint 检查
npm run typecheck   # TypeScript 类型检查
```

### 7.4 手动功能验证清单
1. 访问 `http://localhost:3000/register` 注册新账号。
2. 登录后进入 `/profile`，上传头像验证格式 / 大小校验，再次上传验证旧头像自动清理。
3. 进入 `/prompt` 创建一条私密提示词、一条公开提示词。
4. 编辑提示词，验证 `prompt_history` 中生成历史记录。
5. 进入 `/forum` 浏览公开提示词，执行点赞与收藏。
6. 进入 `/ai-workspace` 与 AI 进行流式对话，刷新后查看 `chat_history` 是否持久化。
7. 进入 `/templates` 选择模板创建提示词。
8. 进入 `/collection` 查看已收藏提示词。

> ✅ 本地自测全部通过。完整业务功能在 `localhost:3000` 下可正常运行。

---

## 八、环境变量说明

| 变量名 | 说明 | 示例值（占位符） |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公开匿名 Key（前端可暴露） | `sb_publishable_xxxxxxxxxxxxxxxx` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥（仅服务端使用，**严禁暴露前端**） | `sb_secret_xxxxxxxxxxxxxxxx` |
| `JWT_SECRET` | JWT 签名密钥，用于用户认证 Token 签发与校验 | `your-random-jwt-secret-string` |
| `SILICONFLOW_API_KEY` | SiliconFlow API Key，用于调用 Qwen 模型 | `sk-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `FREE_MODEL_ID` | 默认调用的 AI 模型 ID | `Qwen/Qwen2.5-7B-Instruct` |
| `NEXT_PUBLIC_APP_URL` | 应用根 URL，用于自动适配本地 / 生产环境 | `http://localhost:3000` |

> ⚠️ **安全提示**：`SUPABASE_SERVICE_ROLE_KEY` 与 `SILICONFLOW_API_KEY` 必须仅保存在服务端环境变量中，禁止以 `NEXT_PUBLIC_` 前缀暴露到前端代码。`.env.local` 已在 `.gitignore` 中忽略，不会推送至仓库。

---

## 九、项目结构简述

```
frontend/
├── app/                  # Next.js App Router 入口
│   ├── api/              # 后端 Route Handler 接口
│   ├── ai-workspace/     # AI 工作台页面
│   ├── collection/       # 我的收藏页面
│   ├── forum/            # 公共论坛页面
│   ├── login/            # 登录页面
│   ├── profile/          # 个人中心页面
│   ├── prompt/           # 我的提示词页面
│   ├── register/         # 注册页面
│   ├── templates/        # 模板库页面
│   ├── layout.tsx        # 全局布局
│   ├── page.tsx          # 首页
│   ├── ThemeProvider.tsx # 主题上下文提供者
│   ├── globals.css       # 全局样式
│   └── not-found.tsx     # 404 页面
├── components/           # 业务可复用组件
│   ├── PromptCard.tsx    # 提示词卡片
│   ├── PromptForm.tsx    # 提示词表单
│   ├── Modal.tsx         # 通用模态框
│   ├── ConfirmModal.tsx  # 确认弹窗
│   ├── Toast.tsx         # 消息提示
│   ├── LoginPopup.tsx    # 登录弹窗
│   ├── HistoryModal.tsx  # 历史记录弹窗
│   ├── Skeleton.tsx      # 骨架屏
│   ├── Empty.tsx         # 空状态
│   └── ThemeToggle.tsx   # 主题切换按钮
├── hooks/                # 自定义 React Hooks
│   └── useTheme.ts       # 主题 Hook
├── lib/                  # 工具库与三层 Supabase 客户端
│   ├── api/prompts.ts    # 提示词接口封装
│   ├── supabase/         # 三层客户端：client/server/admin
│   ├── auth.tsx          # 认证上下文
│   ├── theme.ts          # 主题定义
│   ├── utils.ts          # 通用工具
│   ├── supabase.ts       # 旧版封装（兼容）
│   └── supabase-server.ts# 旧版服务端封装（兼容）
├── types/                # TypeScript 类型定义
│   ├── user.ts
│   ├── prompt.ts
│   └── like.ts
├── supabase/             # 数据库相关
│   ├── schema.sql        # 建表与 RLS 脚本
│   └── cors-policy.json  # CORS 策略配置
├── scripts/              # 运维脚本
│   └── check-supabase.mjs# Supabase 连通性检查
├── tests/                # 测试
│   └── run-tests.mjs     # 内置测试脚本
├── public/               # 静态资源
├── middleware.ts         # Next.js 中间件
├── next.config.ts        # Next.js 配置（图片域名、CORS、Body 大小）
├── vercel.json           # Vercel 部署配置
├── tsconfig.json         # TypeScript 配置
├── eslint.config.mjs     # ESLint 配置
├── postcss.config.mjs    # PostCSS / Tailwind 配置
└── package.json          # 依赖与脚本
```

> 完整分层架构与逐文件说明见 [`docs/project-structure.md`](./docs/project-structure.md)。

---

## 十、部署说明

> 📌 **当前交付状态**：项目代码已全部推送至 GitHub 公开仓库，本地 `localhost:3000` 环境下全部业务功能（用户注册 / 登录 JWT 鉴权、头像上传校验与旧文件清理、提示词 CRUD 与历史快照、点赞收藏、AI 流式对话 + 历史持久化、模板库等）开发完毕并通过自测。唯一缺失交付物为线上 Demo 访问链接。

### 10.1 当前部署状态

- ✅ 代码已推送 GitHub 公开仓库
- ✅ 本地全部业务功能开发完毕，自测通过
- ✅ `vercel.json` 部署配置已就绪（Next.js 框架、构建命令、CORS 头）
- ✅ `next.config.ts` 已配置图片远程域名、Server Actions Body 大小上限（2MB）
- ⏳ 自定义域名 `szy050604.top` 未完成实名认证、DNS 未解析，**暂未生成线上部署 URL**

### 10.2 Vercel 部署流程（域名解锁后执行）

> 「域名 `szy050604.top` 完成实名认证 + DNS 解析后补充完善」——本章节预留，待域名解锁后补充 Vercel 部署链接与具体配置步骤。

预留待补充内容：
- [ ] Vercel 项目创建与 GitHub 仓库连接步骤
- [ ] Vercel 环境变量配置清单
- [ ] 自定义域名绑定与 HTTPS 证书说明
- [ ] 线上 Supabase CORS 配置
- [ ] 线上 Auth 跳转域名配置
- [ ] 线上功能验收清单
- [ ] 线上 Demo 访问 URL

### 10.3 线上 CORS / Auth / 自定义域名（域名解锁后补充）

> 「域名 `szy050604.top` 完成实名认证 + DNS 解析后补充完善」——本章节预留，不输出任何线上 CORS、Auth 跳转域名、自定义域名绑定的配置内容。

---

## 十一、注意事项

1. **本项目不使用任何腾讯云相关技术**（无 TCB、无 CloudBase、无云开发），所有数据存储统一使用 Supabase。
2. **密钥安全**：`SUPABASE_SERVICE_ROLE_KEY` 与 `SILICONFLOW_API_KEY` 严禁出现在前端代码或日志中。
3. **RLS 策略**：项目使用 `service_role` Key 绕过 RLS 进行服务端数据操作（结合自实现 JWT 鉴权），`schema.sql` 中的 RLS 策略作为安全兜底。
4. **头像清理**：更新头像时会自动删除 Storage 中的旧文件，避免存储累积。
5. **流式对话**：AI 接口基于 `ReadableStream` 实现，需客户端支持流式读取。
6. **代码已开源**：项目代码已推送至 GitHub 公开仓库，本地功能全部实现，唯一缺失交付物为线上 Demo 访问链接。

---

## 十二、许可证

MIT License

## 十三、贡献

本项目为单人实训项目，欢迎提交 Issue 交流学习。
