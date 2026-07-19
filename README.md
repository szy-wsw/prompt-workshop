# AI提示词管理平台

> **项目名称**: Prompt Workshop  
> **技术栈**: Next.js 16 + Supabase + SiliconFlow AI  
> **开发状态**: 本地测试完成，待域名解析后部署  

---

## 一、项目简介

AI提示词管理平台是一个基于 Next.js 16 + Supabase 的全栈Web应用，提供提示词的创建、编辑、收藏、点赞等管理功能，并集成硅基流动免费大模型（Qwen2.5-7B-Instruct）实现AI对话能力。

**核心功能**:
- 用户认证（注册/登录/退出）
- AI流式对话（限流保护）
- 提示词管理（CRUD + 标签 + 可见性）
- 互动功能（点赞/收藏）
- 个人中心（头像上传/信息修改）
- 模板库（预设提示词模板）
- 用户排行榜

---

## 二、技术栈

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16 | App Router 模式 |
| React | 19 | 用户界面组件 |
| TypeScript | 5 | 类型安全 |
| CSS Modules | - | 样式方案 |

### 后端/数据库
| 技术 | 说明 |
|------|------|
| Supabase | PostgreSQL 数据库 + 存储 |
| JWT | 自定义认证 |

### AI服务
| 技术 | 模型 |
|------|------|
| SiliconFlow | Qwen2.5-7B-Instruct |

### 部署
| 平台 | 说明 |
|------|------|
| Vercel | 线上部署（待域名解析） |

---

## 三、快速开始

### 3.1 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 3.2 安装依赖

```bash
cd frontend
npm install
```

### 3.3 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 密钥
JWT_SECRET=your-secret-jwt-key

# AI 服务配置
SILICONFLOW_API_KEY=your-siliconflow-api-key
FREE_MODEL_ID=qwen/Qwen2.5-7B-Instruct

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.4 初始化数据库

在 Supabase Dashboard 的 SQL Editor 中执行 `frontend/supabase/schema.sql` 脚本。

### 3.5 启动开发服务器

```bash
npm run dev
```

访问地址：`http://localhost:3000`

---

## 四、项目结构

```
prompt-workshop/
├── frontend/                # Next.js 前端应用
│   ├── app/                 # 页面路由 + API路由
│   ├── components/          # React 组件
│   ├── lib/                 # 工具函数
│   ├── supabase/            # Supabase 配置
│   └── tests/               # 测试脚本
├── docs/                    # 项目文档
└── README.md
```

---

## 五、功能清单

| 模块 | 功能 | 状态 |
|------|------|------|
| 用户认证 | 注册/登录/退出 | ✅ |
| AI对话 | 流式对话/历史记录 | ✅ |
| 提示词管理 | 创建/编辑/删除/查询 | ✅ |
| 互动功能 | 点赞/收藏 | ✅ |
| 个人中心 | 头像上传/信息修改 | ✅ |
| 模板库 | 预设提示词模板 | ✅ |
| 用户排行榜 | 按提示词数/点赞数排名 | ✅ |

---

## 六、API接口

详细接口文档请查看 [docs/api-reference.md](docs/api-reference.md)

---

## 七、文档目录

| 文档 | 路径 | 说明 |
|------|------|------|
| API接口文档 | `docs/api-reference.md` | 完整接口说明 |
| 数据库设计 | `docs/database-design.md` | 表结构与关系 |
| 项目目录结构 | `docs/project-structure.md` | 目录说明 |
| 本地部署手册 | `docs/local-deployment.md` | 部署指南 |
| 功能测试报告 | `docs/test-report.md` | 测试用例与结果 |
| Code Review报告 | `docs/code-review.md` | AI代码审查 |
| Prompt日志 | `prompt_log.md` | AI提示词使用记录 |

---

## 八、测试结果

| 测试模块 | 用例数 | 通过 | 失败 | 通过率 |
|----------|--------|------|------|--------|
| 用户认证 | 6 | 6 | 0 | 100% |
| 提示词管理 | 8 | 8 | 0 | 100% |
| AI对话 | 4 | 4 | 0 | 100% |
| 互动功能 | 4 | 4 | 0 | 100% |
| 个人中心 | 3 | 3 | 0 | 100% |
| **合计** | **25** | **25** | **0** | **100%** |

---

## 九、部署说明

> **注意**: 当前域名未完成解析，部署待后续进行。

部署步骤：
1. 在 Vercel 创建项目，选择 GitHub 仓库
2. 添加环境变量
3. 配置自定义域名
4. 等待 SSL 证书签发

---

## 十、许可证

MIT License

---

> **文档版本**: v1.0  
> **更新时间**: 2026-07-18  
> **备注**: 本文档预留了域名替换位置，待域名解析完成后更新部署地址。
