-- Prompt仓库系统 - 数据库索引优化脚本

-- ==============================================
-- 1. 用户表索引
-- ==============================================
create index if not exists idx_users_email on users (email);

-- ==============================================
-- 2. 提示词表索引
-- ==============================================
create index if not exists idx_prompts_author_id on prompts (author_id);
create index if not exists idx_prompts_visibility on prompts (visibility);
create index if not exists idx_prompts_created_at on prompts (created_at desc);
create index if not exists idx_prompts_author_visibility on prompts (author_id, visibility);

-- ==============================================
-- 3. 点赞表索引
-- ==============================================
create index if not exists idx_likes_prompt_id on likes (prompt_id);
create index if not exists idx_likes_user_id on likes (user_id);
create unique index if not exists idx_likes_prompt_user on likes (prompt_id, user_id);

-- ==============================================
-- 4. 收藏表索引
-- ==============================================
create index if not exists idx_collections_prompt_id on collections (prompt_id);
create index if not exists idx_collections_user_id on collections (user_id);
create unique index if not exists idx_collections_prompt_user on collections (prompt_id, user_id);

-- ==============================================
-- 5. 对话历史表索引
-- ==============================================
create index if not exists idx_chat_user_id on chat_history (user_id);
create index if not exists idx_chat_conversation_id on chat_history (conversation_id);
create index if not exists idx_chat_created_at on chat_history (created_at desc);

-- ==============================================
-- 6. 提示词历史表索引
-- ==============================================
create index if not exists idx_prompt_history_prompt_id on prompt_history (prompt_id);
create index if not exists idx_prompt_history_created_at on prompt_history (created_at desc);

-- ==============================================
-- 7. 全文搜索优化（可选）
-- ==============================================
-- create extension if not exists pg_trgm;
-- create index idx_prompts_title_trgm on prompts using gin (title gin_trgm_ops);
-- create index idx_prompts_content_trgm on prompts using gin (content gin_trgm_ops);

-- ==============================================
-- 8. 添加软删除字段（可选）
-- ==============================================
-- alter table prompts add column if not exists deleted_at timestamptz;
-- create index idx_prompts_deleted_at on prompts (deleted_at);
