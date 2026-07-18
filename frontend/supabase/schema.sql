-- ============================================================
-- Prompt Workshop - Supabase 数据库初始化脚本
-- 使用方法：在 Supabase Dashboard -> SQL Editor 中粘贴执行
-- ============================================================

-- 1. 启用必要的扩展
create extension if not exists "pgcrypto";

-- ============================================================
-- 2. 创建数据表
-- ============================================================

-- 用户表
create table if not exists public.users (
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
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  tags text[] default '{}',
  visibility text default 'private',
  author_id uuid not null references public.users(id) on delete cascade,
  likes_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 提示词历史表
create table if not exists public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  title text not null,
  content text not null,
  tags text[] default '{}',
  visibility text default 'private',
  edited_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- 点赞表
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(prompt_id, user_id)
);

-- 收藏表
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(prompt_id, user_id)
);

-- 聊天历史表
create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid,
  user_message text not null,
  ai_response text not null,
  model text,
  created_at timestamptz default now()
);

-- 模板表
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  tags text[] default '{}',
  category text,
  description text,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. 索引优化
-- ============================================================

create index if not exists idx_prompts_author_id on public.prompts(author_id);
create index if not exists idx_prompts_visibility on public.prompts(visibility);
create index if not exists idx_prompts_created_at on public.prompts(created_at desc);
create index if not exists idx_prompts_tags on public.prompts using gin(tags);
create index if not exists idx_likes_prompt_user on public.likes(prompt_id, user_id);
create index if not exists idx_collections_prompt_user on public.collections(prompt_id, user_id);
create index if not exists idx_chat_history_user_id on public.chat_history(user_id);
create index if not exists idx_prompt_history_prompt_id on public.prompt_history(prompt_id);

-- ============================================================
-- 4. RLS (行级安全) 策略
-- 注意：本项目使用 service_role key 绕过 RLS（自定义 JWT 认证）
-- 以下策略作为安全兜底，确保即使 anon key 暴露也不会泄露数据
-- ============================================================

alter table public.users enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_history enable row level security;
alter table public.likes enable row level security;
alter table public.collections enable row level security;
alter table public.chat_history enable row level security;
alter table public.templates enable row level security;

-- users: 用户只能读自己的信息
drop policy if exists "users read own" on public.users;
create policy "users read own" on public.users
  for select using (auth.uid() = id);

-- prompts: 公开的所有人可读，私密的仅作者可读
drop policy if exists "prompts read public or own" on public.prompts;
create policy "prompts read public or own" on public.prompts
  for select using (visibility = 'public' or auth.uid() = author_id);

-- prompt_history: 仅作者可读
drop policy if exists "prompt_history read own" on public.prompt_history;
create policy "prompt_history read own" on public.prompt_history
  for select using (auth.uid() = edited_by);

-- likes: 登录用户可读自己的点赞
drop policy if exists "likes read own" on public.likes;
create policy "likes read own" on public.likes
  for select using (auth.uid() = user_id);

-- collections: 登录用户可读自己的收藏
drop policy if exists "collections read own" on public.collections;
create policy "collections read own" on public.collections
  for select using (auth.uid() = user_id);

-- chat_history: 仅用户自己可读
drop policy if exists "chat_history read own" on public.chat_history;
create policy "chat_history read own" on public.chat_history
  for select using (auth.uid() = user_id);

-- templates: 所有人可读
drop policy if exists "templates read all" on public.templates;
create policy "templates read all" on public.templates
  for select using (true);

-- ============================================================
-- 5. Storage - avatars bucket (头像存储)
-- ============================================================
-- 注意：以下 SQL 仅在 Supabase 已创建 storage schema 时有效
-- 也可以在 Dashboard -> Storage 中手动创建名为 "avatars" 的 public bucket

-- 创建 avatars bucket (如果 storage 可用)
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true)
    on conflict (id) do nothing;
  end if;
end $$;

-- ============================================================
-- 6. 示例模板数据（可选）
-- ============================================================

insert into public.templates (title, content, tags, category, description)
values
  (
    '文案润色大师',
    '你是一位专业的文案编辑，请帮我润色以下内容，使其更加流畅、有吸引力且易于理解。

要求：
- 保持原意不变
- 语言简洁有力
- 适当增加情感色彩
- 字数控制在 {字数} 字以内

待润色内容：
{内容}',
    ARRAY['写作', '文案', '润色'],
    '写作助手',
    '专业文案润色，让你的文字更有魅力'
  ),
  (
    '代码审查专家',
    '你是一位资深软件工程师，请对以下代码进行代码审查。

审查维度：
1. 代码正确性和潜在 bug
2. 性能优化建议
3. 代码风格和可读性
4. 安全隐患
5. 最佳实践建议

代码：
```{language}
{code}
```

请逐条列出问题并给出修改建议。',
    ARRAY['编程', '代码审查', '质量'],
    '编程助手',
    '全方位代码质量审查与优化建议'
  ),
  (
    '翻译官',
    '你是一位专业翻译，请将以下内容翻译成{目标语言}。

要求：
- 准确传达原意
- 符合目标语言的表达习惯
- 专业术语翻译准确
- 保留原文的格式和语气

原文：
{内容}',
    ARRAY['翻译', '语言', '多语言'],
    '语言工具',
    '精准专业的多语言翻译助手'
  )
on conflict (id) do nothing;

-- ============================================================
-- 完成！
-- ============================================================
