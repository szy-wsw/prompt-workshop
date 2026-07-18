# Prompt仓库 - AI提示词管理平台

一个现代化的AI提示词管理平台，支持提示词的创建、分享、收藏和AI对话功能。

## ✨ 功能特性

### 核心功能
- **提示词管理** - 创建、编辑、删除个人提示词
- **私密/公开分享** - 支持私密和公开两种可见性
- **公共论坛** - 浏览和发现社区分享的优质提示词
- **收藏功能** - 收藏喜欢的提示词
- **AI对话** - 与AI进行智能对话交流
- **对话历史** - 保存和查看AI对话记录

### 新增功能
- **提示词模板库** - 预设模板快速创建提示词
- **用户排行榜** - 查看活跃用户排名
- **批量导出** - 一键导出所有提示词

### 用户体验
- **响应式设计** - 支持多种屏幕尺寸
- **多主题切换** - 5种马卡龙色系主题
- **实时搜索** - 支持关键词和标签搜索
- **流畅动画** - 丰富的交互动画效果

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS 4 + 自定义主题
- **状态管理**: React Context
- **认证**: JWT (HMAC-SHA256)

### 后端
- **数据库**: 腾讯云 TCB 云开发数据库
- **API**: Vercel Edge API Routes
- **AI服务**: SiliconFlow (Qwen2.5-7B-Instruct)

### 部署
- **平台**: Vercel
- **环境变量**: 腾讯云 TCB ENV_ID

## 🚀 快速开始

### 环境要求
- Node.js >= 20.x
- npm >= 10.x

### 安装依赖

```bash
cd frontend
npm install
```

### 环境配置

在 `frontend/.env.local` 文件中配置以下环境变量：

```env
# 腾讯云TCB环境ID
TCB_ENV_ID=your-tcb-env-id

# JWT密钥（用于用户认证）
JWT_SECRET=your-jwt-secret-key

# SiliconFlow AI服务（用于AI对话）
SILICONFLOW_API_KEY=your-siliconflow-api-key
FREE_MODEL_ID=Qwen/Qwen2.5-7B-Instruct

# 站点域名（可选）
NEXT_PUBLIC_SITE_DOMAIN=your-domain.com
```

### 本地开发

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
cd frontend
npm run build
```

### 部署到Vercel

1. 登录 Vercel 控制台
2. 导入 GitHub 仓库
3. 在环境变量设置中添加上述配置
4. 点击部署

## 📁 项目结构

```
frontend/
├── app/                    # 应用页面
│   ├── api/               # API路由
│   ├── ai-workspace/      # AI工作台页面
│   ├── collection/        # 我的收藏页面
│   ├── forum/             # 公共论坛页面
│   ├── login/             # 登录页面
│   ├── profile/           # 个人中心页面
│   ├── prompt/            # 我的提示词页面
│   ├── register/          # 注册页面
│   ├── templates/         # 提示词模板库页面
│   ├── ThemeProvider.tsx  # 主题上下文
│   ├── layout.tsx         # 全局布局
│   └── page.tsx           # 首页
├── components/            # 可复用组件
│   ├── PromptCard.tsx     # 提示词卡片
│   ├── PromptForm.tsx     # 提示词表单
│   ├── Toast.tsx          # 消息提示
│   └── ...
├── lib/                   # 工具库
│   ├── auth.tsx           # 认证上下文
│   ├── tcb-server.ts      # TCB数据库操作
│   ├── memory-db.ts       # 内存数据库（本地测试）
│   └── supabase.ts        # HTTP请求封装
├── types/                 # 类型定义
├── public/                # 静态资源
└── package.json           # 依赖配置
```

## 🔌 API 接口

### 用户认证

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/signup` | POST | 用户注册 |
| `/api/login` | POST | 用户登录 |
| `/api/profile` | PUT | 更新用户信息 |

### 提示词管理

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/prompts` | GET | 获取提示词列表 |
| `/api/prompts` | POST | 创建提示词 |
| `/api/prompts/[id]` | PUT | 更新提示词 |
| `/api/prompts/[id]` | DELETE | 删除提示词 |

### 收藏和点赞

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/collections` | GET/POST/DELETE | 收藏管理 |
| `/api/likes` | GET/POST/DELETE | 点赞管理 |

### AI对话

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/chat` | POST | AI对话接口 |
| `/api/chat-history` | GET | 获取对话历史 |

### 其他

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/templates` | GET | 获取提示词模板 |
| `/api/users/stats` | GET | 获取统计数据 |

## 📊 数据库结构

### users（用户表）
| 字段 | 类型 | 描述 |
|------|------|------|
| _id | string | 用户ID |
| email | string | 邮箱 |
| nickname | string | 昵称 |
| password | string | 加密密码 |
| avatar_url | string | 头像URL |
| created_at | string | 创建时间 |

### prompts（提示词表）
| 字段 | 类型 | 描述 |
|------|------|------|
| _id | string | 提示词ID |
| title | string | 标题 |
| content | string | 内容 |
| tags | array | 标签 |
| visibility | string | 可见性 |
| author_id | string | 作者ID |
| likes_count | number | 点赞数 |
| created_at | string | 创建时间 |

### collections（收藏表）
| 字段 | 类型 | 描述 |
|------|------|------|
| _id | string | 收藏ID |
| user_id | string | 用户ID |
| prompt_id | string | 提示词ID |
| created_at | string | 创建时间 |

### chat_history（对话历史表）
| 字段 | 类型 | 描述 |
|------|------|------|
| _id | string | 记录ID |
| user_id | string | 用户ID |
| messages | array | 消息列表 |
| title | string | 对话标题 |
| created_at | string | 创建时间 |

## 📝 更新日志

### v1.0.0
- 基础功能：用户注册/登录、提示词管理
- 公共论坛：浏览和搜索公开提示词
- AI工作台：与AI进行对话交流
- 收藏功能：收藏喜欢的提示词

### v1.1.0
- 新增：提示词模板库
- 新增：对话历史记录
- 新增：批量导出功能
- 优化：首页布局和浮动按钮交互
- 修复：数据显示和API调用问题

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！