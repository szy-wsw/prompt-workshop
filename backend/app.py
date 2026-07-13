from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 查询全部
@app.get("/api/prompts")
def get_all():
    res = supabase.table("prompts").select("*").order("created_at", desc=True).execute()
    return jsonify(res.data)

# 新增
@app.post("/api/prompts")
def create():
    data = request.json
    if not data.get("title") or not data.get("content"):
        return jsonify({"msg": "标题、内容不能为空"}), 400
    res = supabase.table("prompts").insert(data).execute()
    return jsonify(res.data)

# 修改PUT
@app.put("/api/prompts/<int:pid>")
def update(pid):
    data = request.json
    if not data.get("title") or not data.get("content"):
        return jsonify({"msg": "标题、内容不能为空"}), 400
    res = supabase.table("prompts").update(data).eq("id", pid).execute()
    return jsonify(res.data)

# 删除
@app.delete("/api/prompts/<int:pid>")
def delete(pid):
    supabase.table("prompts").delete().eq("id", pid).execute()
    return jsonify({"msg": "删除成功"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)