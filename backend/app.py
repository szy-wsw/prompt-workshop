from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import uuid
import datetime
import json
from io import BytesIO

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def error_response(message: str, status_code: int = 400):
    return jsonify({"success": False, "message": message}), status_code

def success_response(data=None, message: str = "操作成功"):
    return jsonify({"success": True, "message": message, "data": data})

@app.errorhandler(Exception)
def handle_exception(e):
    return error_response(str(e), 500)

@app.route('/api/health', methods=['GET'])
def health():
    return success_response(message="服务运行正常")

@app.route('/api/users/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    nickname = data.get('nickname')

    if not email or not password or not nickname:
        return error_response("邮箱、密码和昵称不能为空")
    
    if len(password) < 6:
        return error_response("密码长度至少6位")

    try:
        result = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        if result.user:
            supabase.from_('profiles').upsert({
                "id": result.user.id,
                "email": email,
                "nickname": nickname,
                "avatar_url": None,
                "created_at": datetime.datetime.now().isoformat()
            }).execute()
            
            return success_response(message="注册成功")
        else:
            return error_response("注册失败")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/users/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return error_response("邮箱和密码不能为空")

    try:
        result = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if result.user:
            profile = supabase.from_('profiles').select('*').eq('id', result.user.id).single().execute()
            return success_response({
                "user": result.user,
                "profile": profile.data,
                "session": result.session
            }, message="登录成功")
        else:
            return error_response("登录失败")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/users/profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return error_response("用户ID不能为空")

    try:
        result = supabase.from_('profiles').select('*').eq('id', user_id).single().execute()
        return success_response(result.data)
    except Exception as e:
        return error_response(str(e))

@app.route('/api/users/profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    user_id = data.get('user_id')
    nickname = data.get('nickname')
    avatar_url = data.get('avatar_url')

    if not user_id:
        return error_response("用户ID不能为空")

    update_data = {}
    if nickname:
        update_data['nickname'] = nickname
    if avatar_url:
        update_data['avatar_url'] = avatar_url
    update_data['updated_at'] = datetime.datetime.now().isoformat()

    try:
        result = supabase.from_('profiles').update(update_data).eq('id', user_id).execute()
        return success_response(message="更新成功")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/users/password', methods=['PUT'])
def update_password():
    data = request.get_json()
    email = data.get('email')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not email or not old_password or not new_password:
        return error_response("邮箱、旧密码和新密码不能为空")
    
    if len(new_password) < 6:
        return error_response("新密码长度至少6位")

    try:
        supabase.auth.sign_in_with_password({
            "email": email,
            "password": old_password
        })
        
        result = supabase.auth.update_user({
            "password": new_password
        })
        
        return success_response(message="密码更新成功")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/prompts', methods=['GET'])
def get_prompts():
    user_id = request.args.get('user_id')
    visibility = request.args.get('visibility')
    search = request.args.get('search')
    tag = request.args.get('tag')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    try:
        query = supabase.from_('prompts').select('*, profiles(nickname, avatar_url)')
        
        if user_id:
            query = query.eq('author_id', user_id)
        if visibility:
            query = query.eq('visibility', visibility)
        if search:
            query = query.ilike('title', f'%{search}%')
        if tag:
            query = query.contains('tags', [tag])
        
        query = query.order('created_at', desc=True)
        
        offset = (page - 1) * per_page
        result = query.range(offset, offset + per_page - 1).execute()
        
        return success_response(result.data)
    except Exception as e:
        return error_response(str(e))

@app.route('/api/prompts', methods=['POST'])
def create_prompt():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    author_id = data.get('author_id')
    tags = data.get('tags', [])
    visibility = data.get('visibility', 'private')

    if not title or not content or not author_id:
        return error_response("标题、内容和作者ID不能为空")

    try:
        prompt_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "content": content,
            "author_id": author_id,
            "tags": tags,
            "visibility": visibility,
            "likes_count": 0,
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat()
        }
        
        result = supabase.from_('prompts').insert(prompt_data).execute()
        return success_response(result.data[0], message="创建成功")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/prompts/<prompt_id>', methods=['GET'])
def get_prompt(prompt_id):
    try:
        result = supabase.from_('prompts').select('*, profiles(nickname, avatar_url)').eq('id', prompt_id).single().execute()
        return success_response(result.data)
    except Exception as e:
        return error_response(str(e))

@app.route('/api/prompts/<prompt_id>', methods=['PUT'])
def update_prompt(prompt_id):
    data = request.get_json()
    
    update_data = {
        "updated_at": datetime.datetime.now().isoformat()
    }
    
    if 'title' in data:
        update_data['title'] = data['title']
    if 'content' in data:
        update_data['content'] = data['content']
    if 'tags' in data:
        update_data['tags'] = data['tags']
    if 'visibility' in data:
        update_data['visibility'] = data['visibility']

    try:
        result = supabase.from_('prompts').update(update_data).eq('id', prompt_id).execute()
        return success_response(message="更新成功")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/prompts/<prompt_id>', methods=['DELETE'])
def delete_prompt(prompt_id):
    try:
        supabase.from_('likes').delete().eq('prompt_id', prompt_id).execute()
        supabase.from_('collections').delete().eq('prompt_id', prompt_id).execute()
        supabase.from_('prompts').delete().eq('id', prompt_id).execute()
        return success_response(message="删除成功")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/likes', methods=['POST'])
def add_like():
    data = request.get_json()
    prompt_id = data.get('prompt_id')
    user_id = data.get('user_id')

    if not prompt_id or not user_id:
        return error_response("提示词ID和用户ID不能为空")

    try:
        existing = supabase.from_('likes').select('*').eq('prompt_id', prompt_id).eq('user_id', user_id).execute()
        
        if existing.data:
            return error_response("已点赞")
        
        supabase.from_('likes').insert({
            "id": str(uuid.uuid4()),
            "prompt_id": prompt_id,
            "user_id": user_id,
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
        
        supabase.from_('prompts').update({
            "likes_count": supabase.from_('likes').select('id').eq('prompt_id', prompt_id).count().execute().count
        }).eq('id', prompt_id).execute()
        
        return success_response(message="点赞成功")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/likes', methods=['DELETE'])
def remove_like():
    data = request.get_json()
    prompt_id = data.get('prompt_id')
    user_id = data.get('user_id')

    if not prompt_id or not user_id:
        return error_response("提示词ID和用户ID不能为空")

    try:
        supabase.from_('likes').delete().eq('prompt_id', prompt_id).eq('user_id', user_id).execute()
        
        count = supabase.from_('likes').select('id').eq('prompt_id', prompt_id).count().execute().count or 0
        supabase.from_('prompts').update({"likes_count": count}).eq('id', prompt_id).execute()
        
        return success_response(message="取消点赞")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/collections', methods=['POST'])
def add_collection():
    data = request.get_json()
    prompt_id = data.get('prompt_id')
    user_id = data.get('user_id')

    if not prompt_id or not user_id:
        return error_response("提示词ID和用户ID不能为空")

    try:
        existing = supabase.from_('collections').select('*').eq('prompt_id', prompt_id).eq('user_id', user_id).execute()
        
        if existing.data:
            return error_response("已收藏")
        
        supabase.from_('collections').insert({
            "id": str(uuid.uuid4()),
            "prompt_id": prompt_id,
            "user_id": user_id,
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
        
        return success_response(message="收藏成功")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/collections', methods=['DELETE'])
def remove_collection():
    data = request.get_json()
    prompt_id = data.get('prompt_id')
    user_id = data.get('user_id')

    if not prompt_id or not user_id:
        return error_response("提示词ID和用户ID不能为空")

    try:
        supabase.from_('collections').delete().eq('prompt_id', prompt_id).eq('user_id', user_id).execute()
        return success_response(message="取消收藏")
    except Exception as e:
        return error_response(str(e))

@app.route('/api/collections/user/<user_id>', methods=['GET'])
def get_user_collections(user_id):
    try:
        result = supabase.from_('collections').select('*, prompts(*)').eq('user_id', user_id).order('created_at', desc=True).execute()
        return success_response(result.data)
    except Exception as e:
        return error_response(str(e))

@app.route('/api/prompts/export', methods=['POST'])
def export_prompts():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return error_response("用户ID不能为空")

    try:
        result = supabase.from_('prompts').select('*').eq('author_id', user_id).execute()
        prompts = result.data
        
        markdown_content = "# 我的提示词\n\n"
        for i, prompt in enumerate(prompts, 1):
            tags = ", ".join(prompt.get('tags', []))
            visibility = "公开" if prompt.get('visibility') == 'public' else '私密'
            markdown_content += f"## {i}. {prompt.get('title')}\n\n"
            markdown_content += f"**标签**: {tags}\n\n"
            markdown_content += f"**可见性**: {visibility}\n\n"
            markdown_content += f"**创建时间**: {prompt.get('created_at')}\n\n"
            markdown_content += prompt.get('content', '') + "\n\n"
            markdown_content += "---\n\n"

        buffer = BytesIO(markdown_content.encode('utf-8'))
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='text/markdown',
            as_attachment=True,
            download_name=f"prompts_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        )
    except Exception as e:
        return error_response(str(e))

@app.route('/api/tags', methods=['GET'])
def get_tags():
    try:
        result = supabase.from_('prompts').select('tags').execute()
        all_tags = []
        for item in result.data:
            if item.get('tags'):
                all_tags.extend(item['tags'])
        
        unique_tags = list(set(all_tags))
        return success_response(unique_tags)
    except Exception as e:
        return error_response(str(e))

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
