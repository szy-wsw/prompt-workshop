# 提示词使用记录模板

## 说明

本文件记录项目开发过程中使用的AI提示词及其生成结果，用于实训考核材料提交。

---

## 记录条目

### 1. 创建 ThemeProvider 组件

**提示词**:
```
创建一个 Next.js 14 的 ThemeProvider 组件，使用 React Context 管理主题状态，支持5套马卡龙配色主题（粉、蓝、薄荷绿、奶黄、薰衣草紫），主题切换后持久化到 localStorage，通过 CSS 变量注入全局样式。
```

**AI输出**:
- 创建了 `app/ThemeProvider.tsx` 文件
- 实现了 ThemeContext 和 useTheme hook
- 支持5套马卡龙主题配置
- 主题自动持久化到 localStorage

**对应文件**: `frontend/app/ThemeProvider.tsx`

---

### 2. 创建 PromptCard 通用卡片组件

**提示词**:
```
创建一个通用的 PromptCard 组件，包含以下功能：
1. 一键复制提示词内容，复制成功显示"已复制"提示
2. 收藏按钮切换 is_starred 状态
3. 渲染 tags 多标签列表
4. 编辑和删除按钮，删除需要二次确认
5. 使用全局主题 CSS 变量，兼容5套马卡龙配色
6. 文件头部添加 'use client'
```

**AI输出**:
- 创建了 `components/PromptCard.tsx` 文件
- 实现了复制功能（navigator.clipboard）
- 实现了收藏功能（星星图标切换）
- 实现了多标签渲染
- 实现了编辑和删除功能（删除二次确认）
- 使用主题配色变量

**对应文件**: `frontend/components/PromptCard.tsx`

---

### 3. 修复 TSX 语法错误

**提示词**:
```
修复 Next.js 14 中 TSX 语法错误：Expected '>', got 'ident'。问题是在 .ts 文件中写了 JSX 代码。需要：
1. 将 ThemeProvider 组件（包含 JSX）移到 ThemeProvider.tsx 文件
2. 将 useTheme hook 留在 useTheme.ts 文件（纯 TS，无 JSX）
3. 更新 layout.tsx 正确引入 ThemeProvider
```

**AI输出**:
- 创建了 `app/ThemeProvider.tsx`
- 重写了 `app/useTheme.ts` 为纯 TS 文件
- 更新了 `app/layout.tsx` 引入方式
- 修复了 TSX 解析错误

**对应文件**: 
- `frontend/app/ThemeProvider.tsx`
- `frontend/app/useTheme.ts`
- `frontend/app/layout.tsx`

---

### 4. Flask 后端 CRUD 接口

**提示词**:
```
创建 Flask 后端 API，使用 Supabase 数据库，实现提示词的 CRUD 操作：
1. GET /api/prompts - 查询全部（支持 ?starred=true 筛选收藏）
2. POST /api/prompts - 新增提示词
3. PUT /api/prompts/{id} - 更新提示词
4. PUT /api/prompts/{id}/star - 切换收藏状态
5. DELETE /api/prompts/{id} - 删除提示词
6. 统一异常处理，标准化 JSON 返回格式
7. 添加环境变量空值校验
```

**AI输出**:
- 创建了完整的 `backend/app.py`
- 实现了5个 CRUD 接口
- 添加了统一响应格式和异常处理
- 添加了环境变量校验

**对应文件**: `backend/app.py`

---

### 5. 创建收藏页面

**提示词**:
```
创建收藏页面 app/collection/page.tsx，只查询 is_starred=true 的数据，复用 PromptCard 组件，显示收藏的提示词列表，支持取消收藏和删除操作。
```

**AI输出**:
- 创建了 `app/collection/page.tsx`
- 调用 getStarredPrompts API 获取收藏数据
- 复用 PromptCard 组件展示
- 支持取消收藏和删除

**对应文件**: `frontend/app/collection/page.tsx`

---

### 6. 创建 AI 工作台静态占位页

**提示词**:
```
创建 AI 工作台页面 app/ai-workspace/page.tsx，作为静态占位页面，无任何网络请求。显示文字："AI提示词运行/优化功能为预留拓展模块，本地算力不足暂未部署，后续可安装Ollama qwen2.5启用"。添加部署说明。
```

**AI输出**:
- 创建了 `app/ai-workspace/page.tsx`
- 静态页面，无网络请求
- 显示 AI 功能预留说明
- 添加了 Ollama 部署说明

**对应文件**: `frontend/app/ai-workspace/page.tsx`

---

### 7. 更新全局导航栏

**提示词**:
```
更新 app/layout.tsx，添加顶部全局导航栏，包含三个链接：提示词列表（/）、我的收藏（/collection）、AI工作台（/ai-workspace），导航栏适配主题色。
```

**AI输出**:
- 更新了 `app/layout.tsx`
- 添加了固定顶部导航栏
- 三个导航链接
- 使用主题配色

**对应文件**: `frontend/app/layout.tsx`

---

### 8. 更新 PromptForm 添加标签字段

**提示词**:
```
更新 components/PromptForm.tsx，添加 tags 字段输入框，用户可以用逗号分隔输入多个标签，提交时转换为数组。
```

**AI输出**:
- 更新了 `components/PromptForm.tsx`
- 添加了 tags 输入框
- 支持逗号分隔输入
- 提交时转换为数组格式

**对应文件**: `frontend/components/PromptForm.tsx`

---

### 9. 创建 API 接口文档

**提示词**:
```
为 Flask 后端 API 创建完整的接口文档，包含所有 CRUD 接口的请求方式、URL、参数、请求示例、响应示例。
```

**AI输出**:
- 创建了 `docs/api.md`
- 包含5个接口的完整文档
- 统一返回格式说明
- 错误码说明

**对应文件**: `docs/api.md`

---

### 10. 创建项目 README

**提示词**:
```
创建项目 README.md，包含项目介绍、技术栈、功能清单、快速开始、项目结构、主题配置、Vercel 部署教程等内容。
```

**AI输出**:
- 创建了完整的 `README.md`
- 项目介绍和技术栈
- 功能清单
- 启动命令
- 部署教程

**对应文件**: `README.md`