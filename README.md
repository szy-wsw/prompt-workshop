# AI 提示词管理工坊

基于 Next.js 14 + Flask + Supabase 的提示词管理实训系统，支持5套马卡龙主题切换、提示词CRUD、收藏、多标签等功能。

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: CSS Variables + 原生CSS
- **状态管理**: React Context + localStorage

### 后端
- **框架**: Flask 2.x
- **数据库**: Supabase (PostgreSQL)
- **跨域**: Flask-CORS

### 部署
- **前端**: Vercel
- **后端**: 本地运行（预留云端部署能力）

## 功能清单

- ✅ 提示词列表管理（分页、搜索）
- ✅ 提示词新增/编辑/删除
- ✅ 收藏功能（is_starred）
- ✅ 多标签支持（tags）
- ✅ 一键复制提示词
- ✅ 5套马卡龙主题切换
- ✅ 主题本地持久化
- ✅ 收藏页面
- ✅ AI工作台（静态占位页，预留拓展）

## 快速开始

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 后端启动

```bash
cd backend
pip install flask flask-cors supabase python-dotenv
python app.py
```

后端服务运行在 http://localhost:5000

### 环境配置

在 `backend/.env` 中配置 Supabase 凭证：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Supabase 表结构

需要在 Supabase 中创建 `prompts` 表：

```sql
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT '通用',
  is_starred BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 项目结构

```
prompt-workshop/
├── frontend/                 # Next.js 前端
│   ├── app/                 # App Router 页面
│   │   ├── layout.tsx       # 全局布局
│   │   ├── page.tsx         # 提示词列表页
│   │   ├── ThemeProvider.tsx # 主题提供者
│   │   ├── ThemeToggle.tsx  # 主题切换组件
│   │   ├── useTheme.ts      # 主题Hook
│   │   ├── theme.ts         # 主题配置
│   │   ├── collection/      # 收藏页面
│   │   └── ai-workspace/    # AI工作台
│   ├── components/          # 公共组件
│   │   ├── Modal.tsx        # 弹窗组件
│   │   ├── PromptCard.tsx   # 提示词卡片
│   │   └── PromptForm.tsx   # 表单组件
│   ├── lib/api/            # API调用
│   ├── types/              # TypeScript类型
│   └── hooks/              # 自定义Hook
├── backend/                 # Flask 后端
│   ├── app.py              # 主应用
│   ├── .env                # 环境变量
│   └── .env.example        # 环境变量模板
├── docs/                   # 文档
└── README.md               # 项目说明
```

## 主题配置

系统内置5套马卡龙主题：

1. **macaron-pink** - 马卡龙粉
2. **macaron-blue** - 马卡龙浅蓝
3. **macaron-mint** - 马卡龙薄荷绿
4. **macaron-yellow** - 马卡龙奶黄
5. **macaron-lavender** - 马卡龙薰衣草紫

主题切换后自动持久化到 localStorage。

## Vercel 部署教程

1. 登录 Vercel 控制台
2. 点击 "New Project"
3. 选择 GitHub 仓库
4. 配置项目：
   - Framework Preset: Next.js
   - Root Directory: frontend
5. 点击 "Deploy"

部署完成后获得线上访问地址。

## AI 模块说明

AI提示词运行/优化功能为预留拓展模块，本地算力不足暂未部署。

后续可安装 Ollama + qwen2.5 启用完整AI功能：

```bash
# 安装 Ollama
curl https://ollama.ai/install.sh | sh

# 拉取模型
ollama pull qwen2.5

# 启动服务
ollama serve
```

## License

MIT