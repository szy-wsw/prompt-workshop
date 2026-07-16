"""
Prompt提示词管理系统 - 后端服务
数据库: Supabase (service_role服务密钥 + 3次自动重连)
AI: 硅基流动免费Qwen/Qwen2.5-7B-Instruct (国内直连)
"""
from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import time
import uuid
import hashlib
import requests
from functools import wraps

load_dotenv()

app = Flask(__name__)

# 全局跨域放行前端3000端口
CORS(
    app,
    origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)

# ===== Supabase配置 =====
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# ===== AI配置 =====
SILICONFLOW_API_KEY = os.getenv("SILICONFLOW_API_KEY", "")
SILICONFLOW_BASE_URL = os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
FREE_MODEL_ID = os.getenv("FREE_MODEL_ID", "Qwen/Qwen2.5-7B-Instruct")

# ===== 代理配置（加速海外Supabase访问） =====
HTTP_PROXY = os.getenv("HTTP_PROXY", "")
HTTPS_PROXY = os.getenv("HTTPS_PROXY", "")

# 代理session
_session = None
def get_session():
    global _session
    if _session is None:
        _session = requests.Session()
        if HTTP_PROXY or HTTPS_PROXY:
            proxies = {}
            if HTTP_PROXY:
                proxies["http"] = HTTP_PROXY
            if HTTPS_PROXY:
                proxies["https"] = HTTPS_PROXY
            _session.proxies.update(proxies)
            print(f"[代理] 已启用: {proxies}")
        else:
            print("[代理] 未配置代理，直连Supabase")
    return _session

# ===== 限流配置 =====
RATE_LIMIT = 8
RATE_LIMIT_WINDOW = 60
request_counts = {}

# ===== 常量 =====
MAX_RETRIES = 3
RETRY_DELAY = 1.5


def supabase_request(method, path, json_body=None, params=None, timeout=15):
    """
    封装Supabase REST API请求，内置3次自动重连
    使用service_role密钥，绕过RLS，权限更高
    """
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    session = get_session()
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.request(
                method=method,
                url=url,
                headers=headers,
                json=json_body,
                params=params,
                timeout=timeout
            )
            return resp
        except requests.exceptions.ConnectionError as e:
            last_error = e
            print(f"[Supabase重连] 第{attempt}/{MAX_RETRIES}次连接失败: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise
        except requests.exceptions.Timeout as e:
            last_error = e
            print(f"[Supabase重连] 第{attempt}/{MAX_RETRIES}次超时: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise
        except Exception as e:
            last_error = e
            print(f"[Supabase重连] 第{attempt}/{MAX_RETRIES}次异常: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise

    raise last_error


def error_response(message: str, status_code: int = 400):
    response = jsonify({"success": False, "message": message, "data": None})
    response.status_code = status_code
    return response


def success_response(data=None, message: str = "操作成功"):
    return jsonify({"success": True, "message": message, "data": data})


@app.before_request
def handle_options():
    """OPTIONS预检全局兜底"""
    if request.method == 'OPTIONS':
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.status_code = 200
        return response


def auth_required(f):
    """认证装饰器 - 验证Supabase JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error_response("请先登录", 401)
        try:
            token = auth_header.replace('Bearer ', '')

            # 通过Supabase验证token（带3次重连）
            url = f"{SUPABASE_URL}/auth/v1/user"
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {token}"
            }
            session = get_session()
            last_error = None
            me_resp = None

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    me_resp = session.get(url, headers=headers, timeout=10)
                    break
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                    last_error = e
                    print(f"[认证重连] 第{attempt}/{MAX_RETRIES}次: {e}")
                    if attempt < MAX_RETRIES:
                        time.sleep(RETRY_DELAY * attempt)
                    else:
                        raise

            if me_resp is None or me_resp.status_code != 200:
                return error_response("登录已过期，请重新登录", 401)

            user_data = me_resp.json()
            g.user = user_data
            g.token = token
        except Exception as e:
            print(f"[认证失败] {e}")
            return error_response("登录验证失败，请重新登录", 401)
        return f(*args, **kwargs)
    return decorated_function


def rate_limit(f):
    """限流装饰器 - 单用户每分钟8次"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = getattr(g, 'user', None)
        if not user:
            return error_response("请先登录", 401)

        uid = user.get('id', '')
        now = time.time()
        if uid not in request_counts:
            request_counts[uid] = {'count': 1, 'start': now}
        else:
            elapsed = now - request_counts[uid]['start']
            if elapsed > RATE_LIMIT_WINDOW:
                request_counts[uid] = {'count': 1, 'start': now}
            else:
                request_counts[uid]['count'] += 1
                if request_counts[uid]['count'] > RATE_LIMIT:
                    remaining = int(RATE_LIMIT_WINDOW - elapsed)
                    return error_response(f"请求过于频繁，请{remaining}秒后再试", 429)
        return f(*args, **kwargs)
    return decorated_function


# ==================== 健康检测 + 数据库保活 ====================
@app.route('/api/health', methods=['GET'])
def health():
    """健康检测 + Supabase保活，防止闲置"""
    try:
        resp = supabase_request(
            "GET",
            "/rest/v1/users?select=id&limit=1",
            timeout=10
        )
        if resp.status_code == 200:
            return success_response(message="服务正常，数据库连接成功")
        return error_response(f"数据库状态异常({resp.status_code})", 500)
    except Exception as e:
        print(f"[健康检测失败] {e}")
        return error_response(f"数据库连接失败: {str(e)}", 500)


# ==================== 注册接口 ====================
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """用户注册 - 后端中转Supabase Auth"""
    try:
        data = request.get_json() or {}
        nickname = data.get('nickname', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')

        # 本地前置校验
        if not nickname:
            return error_response("请输入昵称")
        if len(nickname) < 2:
            return error_response("昵称至少2个字符")
        if not email:
            return error_response("请输入邮箱")
        if '@' not in email or '.' not in email:
            return error_response("邮箱格式不正确")
        if not password:
            return error_response("请输入密码")
        if len(password) < 6:
            return error_response("密码至少6位")

        # 通过Supabase Admin API创建用户（service_role权限，3次重连）
        try:
            resp = supabase_request(
                "POST",
                "/auth/v1/admin/users",
                json_body={
                    "email": email,
                    "password": password,
                    "user_metadata": {"nickname": nickname},
                    "email_confirm": True
                },
                timeout=30
            )

            if resp.status_code in (200, 201):
                user_data = resp.json()
                user_id = user_data.get('id')

                if not user_id:
                    return error_response("注册失败，未获取到用户ID")

                print(f"[注册成功] 用户ID: {user_id}, 邮箱: {email}")
                return success_response(message="注册成功，请登录")

            # 解析错误
            try:
                err_data = resp.json()
                err_msg = err_data.get('msg', err_data.get('message', ''))
            except Exception:
                err_msg = f"注册失败(HTTP {resp.status_code})"

            err_lower = (err_msg or '').lower()
            if "already" in err_lower and ("registered" in err_lower or "exists" in err_lower):
                return error_response("该邮箱已注册，请直接登录")
            if "password" in err_lower and ("short" in err_lower or "weak" in err_lower):
                return error_response("密码不符合安全要求")
            if "email" in err_lower and "invalid" in err_lower:
                return error_response("邮箱格式不正确")

            return error_response(err_msg or "注册失败")

        except requests.exceptions.ConnectionError:
            return error_response("无法连接数据库服务器，请检查网络或开启代理")
        except requests.exceptions.Timeout:
            return error_response("请求超时，请稍后重试")
        except Exception as e:
            print(f"[注册Supabase异常] {e}")
            return error_response(f"注册失败: {str(e)}")

    except Exception as e:
        print(f"[注册接口异常] {e}")
        return error_response("注册失败，请稍后重试")


# ==================== 登录接口 ====================
@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录 - 后端中转Supabase Auth"""
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip()
        password = data.get('password', '')

        if not email:
            return error_response("请输入邮箱")
        if not password:
            return error_response("请输入密码")

        try:
            resp = supabase_request(
                "POST",
                "/auth/v1/token?grant_type=password",
                json_body={"email": email, "password": password},
                timeout=30
            )

            if resp.status_code == 200:
                session_data = resp.json()
                user = session_data.get('user', {})
                user_id = user.get('id')

                if not user_id:
                    return error_response("登录失败，未获取到用户信息")

                # 获取profile中的nickname
                nickname = user.get('user_metadata', {}).get('nickname', '用户')

                print(f"[登录成功] 用户ID: {user_id}, 邮箱: {email}")
                return success_response({
                    "user": {
                        "id": user_id,
                        "email": user.get('email'),
                        "nickname": nickname
                    },
                    "session": {
                        "access_token": session_data.get('access_token'),
                        "refresh_token": session_data.get('refresh_token'),
                        "expires_at": session_data.get('expires_at')
                    }
                }, message="登录成功")

            try:
                err_data = resp.json()
                err_msg = err_data.get('msg', err_data.get('message', '登录失败'))
            except Exception:
                err_msg = f"登录失败(HTTP {resp.status_code})"

            err_lower = (err_msg or '').lower()
            if "invalid" in err_lower and ("login" in err_lower or "credentials" in err_lower):
                return error_response("邮箱或密码错误")
            if "email" in err_lower and "not confirmed" in err_lower:
                return error_response("邮箱未验证")

            return error_response(err_msg)

        except requests.exceptions.ConnectionError:
            return error_response("无法连接数据库服务器，请检查网络或开启代理")
        except requests.exceptions.Timeout:
            return error_response("请求超时，请稍后重试")
        except Exception as e:
            print(f"[登录Supabase异常] {e}")
            return error_response(f"登录失败: {str(e)}")

    except Exception as e:
        print(f"[登录接口异常] {e}")
        return error_response("登录失败，请稍后重试")


# ==================== 获取当前用户 ====================
@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_me():
    """获取当前登录用户信息"""
    try:
        user = g.user
        return success_response({
            "user": {
                "id": user.get('id'),
                "email": user.get('email'),
                "nickname": user.get('user_metadata', {}).get('nickname', '用户')
            }
        })
    except Exception as e:
        return error_response("获取用户信息失败", 401)


# ==================== 退出登录 ====================
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """退出登录"""
    return success_response(message="退出成功")


# ==================== AI对话接口 ====================
@app.route('/api/ai/chat', methods=['POST'])
@auth_required
@rate_limit
def ai_chat():
    """AI对话 - 硅基流动免费模型（国内直连，不受海外网络影响）"""
    if not SILICONFLOW_API_KEY:
        return error_response("AI服务未配置")

    try:
        data = request.get_json() or {}
        messages = data.get('messages', [])
        prompt = data.get('prompt', '')

        if not messages and not prompt:
            return error_response("请输入内容")

        if prompt and not messages:
            messages = [{"role": "user", "content": prompt}]

        print(f"[AI调用] 模型: {FREE_MODEL_ID}, 用户ID: {g.user.get('id')}")

        def generate_stream():
            try:
                response = requests.post(
                    f"{SILICONFLOW_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {SILICONFLOW_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": FREE_MODEL_ID,
                        "messages": messages,
                        "stream": True
                    },
                    stream=True,
                    timeout=120
                )

                if response.status_code == 429:
                    yield f"data: {json.dumps({'error': 'AI访问繁忙，请稍后重试', 'done': True})}\n\n"
                    return

                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': f'AI服务异常({response.status_code})', 'done': True})}\n\n"
                    return

                for line in response.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            try:
                                json_line = json.loads(line_str[6:])
                                delta = json_line.get('choices', [{}])[0].get('delta', {})
                                content = delta.get('content', '')
                                if content:
                                    yield f"data: {json.dumps({'response': content, 'done': False})}\n\n"
                                if json_line.get('choices', [{}])[0].get('finish_reason'):
                                    yield f"data: {json.dumps({'response': '', 'done': True})}\n\n"
                                    break
                            except:
                                pass
            except requests.exceptions.RequestException as e:
                if "429" in str(e):
                    yield f"data: {json.dumps({'error': 'AI访问繁忙，请稍后重试', 'done': True})}\n\n"
                else:
                    yield f"data: {json.dumps({'error': f'网络错误: {str(e)}', 'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

        return Response(generate_stream(), mimetype='text/event-stream')

    except Exception as e:
        print(f"[AI对话异常] {e}")
        return error_response(f"AI对话失败: {str(e)}")


# ==================== AI状态检测 ====================
@app.route('/api/ai/status', methods=['GET'])
@auth_required
def ai_status():
    """AI服务状态检测"""
    if not SILICONFLOW_API_KEY:
        return success_response({"online": False, "message": "AI服务未配置"})
    try:
        response = requests.get(
            f"{SILICONFLOW_BASE_URL}/models",
            headers={"Authorization": f"Bearer {SILICONFLOW_API_KEY}"},
            timeout=5
        )
        if response.status_code == 200:
            return success_response({"online": True, "message": "AI服务在线"})
        return success_response({"online": False, "message": "AI服务状态异常"})
    except Exception:
        return success_response({"online": False, "message": "AI服务连接失败"})


# ==================== 启动服务 ====================
def print_routes():
    print("\n[路由清单] 可用接口：")
    rules = []
    for rule in app.url_map.iter_rules():
        methods = [m for m in rule.methods if m not in ('OPTIONS', 'HEAD')]
        rules.append((str(rule), methods))

    rules.sort(key=lambda x: x[0])
    for path, methods in rules:
        print(f"  {', '.join(methods):<12} {path}")


if __name__ == '__main__':
    # 初始化代理session
    get_session()

    print(f"🚀 后端服务启动在 http://localhost:5000")
    print(f"📡 CORS已放行: http://localhost:3000")
    print(f"📦 数据库: Supabase (service_role密钥 + {MAX_RETRIES}次自动重连)")
    print(f"🤖 AI模型: {FREE_MODEL_ID} (硅基流动国内直连)")
    print_routes()

    app.run(host='0.0.0.0', port=5000, debug=False)