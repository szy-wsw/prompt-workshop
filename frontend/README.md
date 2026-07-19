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

# AI对话模型
FREE_MODEL_ID=Qwen/Qwen2.5-7B-Instruct

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

完整的 API 接口文档请查看 [API_DOCS.md](API_DOCS.md)

## 开发日志

详细的开发过程请查看 [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)

## Prompt 日志

AI 辅助开发的对话记录请查看 [PROMPT_LOG.md](PROMPT_LOG.md)

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
