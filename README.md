# Prompt 仓库系统

> 一个基于 Next.js + Supabase 的提示词管理与分享平台

## 项目简介

Prompt 仓库系统是一个用于管理、分享和发现 AI 提示词的平台。用户可以创建、编辑、收藏提示词，并与其他用户分享优质内容。系统集成了 AI 对话功能，支持基于硅基流动 API 的实时对话。

## 功能特性

### 🎯 核心功能
- **用户认证** - 邮箱注册/登录，JWT 安全认证
- **提示词管理** - 创建、编辑、删除提示词，支持版本历史
- **公共论坛** - 浏览、搜索、点赞公开提示词
- **AI 对话** - 集成硅基流动 API，支持多种模型
- **个人中心** - 头像上传、统计数据、批量导出

### ✨ 特色功能
- 支持公开/私有提示词切换
- 标签分类与筛选
- 点赞和收藏系统
- 对话历史记录
- 暗黑/浅色主题切换

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.2.10 |
| UI 框架 | React | 18.2.0 |
| 语言 | TypeScript | - |
| 样式 | TailwindCSS | 3.4.1 |
| 数据库 | Supabase | - |
| 认证 | JWT | - |
| AI 服务 | 硅基流动 API | - |
| 图标 | Lucide React | - |

## 项目结构

```
frontend/
├── app/                    # Next.js App Router
│   ├── login/              # 登录页面
│   ├── register/           # 注册页面
│   ├── prompt/             # 提示词管理页面
│   ├── forum/              # 公共论坛页面
│   ├── ai-workspace/       # AI对话工作台
│   ├── profile/            # 个人中心
│   ├── api/                # API接口
│   │   ├── signup/         # 注册接口
│   │   ├── login/          # 登录接口
│   │   ├── prompts/        # 提示词接口
│   │   ├── likes/          # 点赞接口
│   │   ├── collections/    # 收藏接口
│   │   ├── chat/           # AI对话接口
│   │   └── users/          # 用户相关接口
│   ├── layout.tsx          # 全局布局
│   └── page.tsx            # 首页
├── components/             # 公共组件
│   ├── Navbar.tsx          # 导航栏
│   ├── Toast.tsx           # 提示组件
│   └── FloatingButton.tsx  # 浮动按钮
├── lib/                    # 工具库
│   ├── supabase.ts         # Supabase配置
│   └── auth.ts             # 认证逻辑
├── types/                  # TypeScript类型定义
├── styles/                 # 全局样式
├── middleware.ts           # 中间件
└── .env.local              # 环境变量
```

## 快速开始

### 环境要求

- Node.js >= 18.17.0
- npm >= 9.6.7

### 安装依赖

```bash
cd frontend
npm install
```

### 配置环境变量

在 `frontend` 目录下创建 `.env.local` 文件：

```env
# Supabase核心配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT认证密钥
JWT_SECRET=your-jwt-secret-key

# 硅基流动AI服务API密钥
SILICONFLOW_API_KEY=your-siliconflow-api-key

# AI对话模型（推荐使用 deepseek-ai/DeepSeek-V4-Flash）
FREE_MODEL_ID=deepseek-ai/DeepSeek-V4-Flash

# 应用URL
NEXT_PUBLIC_APP_URL=https://szy050604.top
```

### 数据库配置

在 Supabase 控制台执行以下 SQL 创建表结构：

```sql
-- 用户表
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null,
  salt text not null,
  nickname text not null,
  avatar_url text default '',
  avatar_path text default '',
  avatar text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 提示词表
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  tags text[] default '{}',
  visibility text default 'private',
  author_id text not null,
  likes_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 提示词历史表
create table if not exists prompt_history (
  id uuid primary key default gen_random_uuid(),
  prompt_id text not null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  visibility text default 'private',
  edited_by text not null,
  created_at timestamptz default now()
);

-- 点赞表
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  prompt_id text not null,
  user_id text not null,
  created_at timestamptz default now(),
  unique(prompt_id, user_id)
);

-- 收藏表
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  prompt_id text not null,
  user_id text not null,
  created_at timestamptz default now(),
  unique(prompt_id, user_id)
);

-- 对话历史表
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  conversation_id text,
  user_message text not null,
  ai_response text not null,
  model text not null,
  created_at timestamptz default now()
);

-- 禁用RLS并授权
alter table users disable row level security;
alter table prompts disable row level security;
alter table prompt_history disable row level security;
alter table likes disable row level security;
alter table collections disable row level security;
alter table chat_history disable row level security;

grant all privileges on table users to service_role;
grant all privileges on table prompts to service_role;
grant all privileges on table prompt_history to service_role;
grant all privileges on table likes to service_role;
grant all privileges on table collections to service_role;
grant all privileges on table chat_history to service_role;

grant all privileges on table users to anon;
grant all privileges on table prompts to anon;
grant all privileges on table prompt_history to anon;
grant all privileges on table likes to anon;
grant all privileges on table collections to anon;
grant all privileges on table chat_history to anon;
```

### 创建存储桶

在 Supabase 控制台创建 `avatars` 存储桶用于存储用户头像。

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## API 接口文档

### 认证接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 注册 | POST | /api/signup | 用户注册 |
| 登录 | POST | /api/login | 用户登录 |
| 获取用户信息 | GET | /api/profile | 获取当前用户信息 |
| 更新用户信息 | PUT | /api/profile | 更新用户信息 |
| 上传头像 | POST | /api/profile/avatar | 上传用户头像 |

### 提示词接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 创建提示词 | POST | /api/prompts | 创建新提示词 |
| 获取提示词列表 | GET | /api/prompts | 获取提示词列表 |
| 获取单个提示词 | GET | /api/prompts/[id] | 获取单个提示词详情 |
| 更新提示词 | PUT | /api/prompts/[id] | 更新提示词 |
| 删除提示词 | DELETE | /api/prompts/[id] | 删除提示词 |

### 互动接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 点赞 | POST | /api/likes | 点赞/取消点赞 |
| 检查点赞状态 | GET | /api/likes/check | 检查是否已点赞 |
| 收藏 | POST | /api/collections | 收藏/取消收藏 |
| 检查收藏状态 | GET | /api/collections/check | 检查是否已收藏 |

### AI对话接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| AI对话 | POST | /api/chat | 与AI进行对话（非流式响应） |
| 获取聊天历史 | GET | /api/chat-history | 获取聊天历史记录 |
| AI服务状态 | GET | /api/ai/status | 获取AI服务状态和模型列表 |

### 用户接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 用户排行榜 | GET | /api/users/ranking | 获取用户排行榜 |
| 系统统计 | GET | /api/users/stats | 获取系统统计数据 |

### 模板接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取模板 | GET | /api/templates | 获取提示词模板列表 |

## 开发日志

### 阶段一：项目初始化
- 创建 Next.js 项目，配置 TypeScript
- 搭建基础页面路由（首页、登录、注册）
- 配置 Supabase 数据库连接

### 阶段二：核心功能开发
- 实现用户注册/登录功能
- 开发提示词 CRUD 操作
- 实现点赞和收藏系统
- 集成 AI 对话功能

### 阶段三：优化与完善
- 修复 React key 重复错误
- 优化论坛页面布局
- 修复 AI 接口认证问题
- 添加头像上传功能
- 优化数据库查询性能

### 阶段四：文档与测试
- 编写 API 接口文档
- 编写数据库设计文档
- 进行功能测试验证
- 生成 AI Code Review 报告

### 阶段五：AI对话修复
- 修复 AI 对话输出乱码问题
- 将流式响应改为非流式响应（Vercel代理导致流式响应损坏）
- 移除 system prompt（模型处理中文特殊符号时出现问题）
- 精简模型列表为3款稳定免费模型

## Prompt 日志

### 1. 创建 ThemeProvider 组件
使用 AI 创建了支持多主题切换的 ThemeProvider，包含马卡龙配色主题（粉、蓝、薄荷绿、奶黄、薰衣草紫），主题切换后自动持久化到 localStorage。

### 2. 创建 PromptCard 通用卡片组件
使用 AI 创建了提示词卡片组件，支持标签展示、点赞收藏按钮、作者信息展示等功能。

### 3. 修复 React key 重复错误
使用 AI 诊断并修复了提示词标签显示乱码问题，将 key 从 `key={tag}` 修改为 `key={${index}-${tag}}`。

### 4. 优化论坛页面布局
使用 AI 优化了论坛页面布局，将搜索框和标签按钮分为两行显示，解决了布局重叠问题。

### 5. 修复 AI 接口 401 错误
使用 AI 排查并修复了硅基流动 API 认证问题，更新了正确的 API Key。

### 6. 实现头像上传功能
使用 AI 实现了头像上传功能，支持 jpg/png/webp 格式，限制 2MB 大小，上传到 Supabase Storage。

### 7. 生成 Code Review 报告
使用 AI 对项目代码进行全面审查，发现了 JWT 密钥安全、RLS 行级安全、类型安全等问题，并给出优化建议。

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 在 Vercel 项目设置中配置环境变量
3. 部署即可

### 域名配置

当前域名：szy050604.top（待审核）

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

**项目状态**: 开发中 ✅  
**最后更新**: 2026年7月  
**部署域名**: szy050604.top（待审核）
