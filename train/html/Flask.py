from flask import Flask, request, jsonify, send_from_directory
import os
import json
import datetime
import argparse
import functools
from macls.predict import MAClsPredictor
from macls.utils.utils import add_arguments, print_arguments
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ------------------------------
# 文件路径配置
# ------------------------------
DATA_DIR = "data"
RECORD_FILE = os.path.join(DATA_DIR, "records.json")
USER_FILE = os.path.join(DATA_DIR, "user.json")
UPLOAD_DIR = "uploads"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

if not os.path.exists(RECORD_FILE):
    with open(RECORD_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)

if not os.path.exists(USER_FILE):
    with open(USER_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "username": "南哪战队队员",
            "email": "team@nannan.edu.cn",
            "regdate": str(datetime.date.today())
        }, f, ensure_ascii=False, indent=2)

# ------------------------------
# 初始化预测模型（只加载一次）
# ------------------------------
parser = argparse.ArgumentParser(description="智慧水务音频识别")
add_arg = functools.partial(add_arguments, argparser=parser)
add_arg('configs', str, '../configs/resnet_se.yml', '配置文件')
add_arg('use_gpu', bool, True, '是否使用GPU预测')
add_arg('model_path', str, '../models/ResNetSE_Fbank/best_model/', '导出的预测模型文件路径')
args = parser.parse_args(args=[])  # ⚠️ 空参数列表防止命令行冲突

print_arguments(args=args)

print("🚀 正在加载音频识别模型，请稍候...")
predictor = MAClsPredictor(
    configs=args.configs,
    model_path=args.model_path,
    use_gpu=args.use_gpu
)
print("✅ 模型加载完成！")

# ------------------------------
# 提供静态音频访问
# ------------------------------
@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# ------------------------------
# 音频识别接口
# ------------------------------
@app.route("/api/recognize", methods=["POST"])
def recognize_audio():
    if 'file' not in request.files:
        return jsonify({'error': '没有检测到文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(save_path)

    try:
        result, score = predictor.predict(save_path)
        print(f"[识别完成] {file.filename} → 识别结果：{result}（置信度：{score:.4f}）")
        return jsonify({
            'filename': file.filename,
            'result': result,
            'confidence': round(float(score), 4),
            'filepath': f"/uploads/{file.filename}"  # 前端可访问
        })
    except Exception as e:
        print("[识别出错]", e)
        return jsonify({'error': str(e)}), 500

# ------------------------------
# 保存识别记录
# ------------------------------
@app.route("/api/save_record", methods=["POST"])
def save_record():
    data = request.json
    with open(RECORD_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)

    new_record = {
        "filename": data["filename"],
        "result": data["result"],
        "confidence": data.get("confidence", None),
        "date": data["date"],
        "filepath": data.get("filepath")
    }
    records.append(new_record)

    with open(RECORD_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "ok"})

# ------------------------------
# 删除识别记录
# ------------------------------
@app.route("/api/delete_record", methods=["POST"])
def delete_record():
    data = request.json
    filename = data.get("filename")
    if not filename:
        return jsonify({"error": "未提供文件名"}), 400

    with open(RECORD_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)

    record_to_delete = next((r for r in records if r["filename"] == filename), None)
    if not record_to_delete:
        return jsonify({"error": "未找到对应记录"}), 404

    # 删除音频文件
    filepath = os.path.join(".", record_to_delete.get("filepath", ""))
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            print(f"[删除文件出错] {filepath}: {e}")

    records.remove(record_to_delete)

    with open(RECORD_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "ok"})

# ------------------------------
# 获取识别记录
# ------------------------------
@app.route("/api/records")
def get_records():
    with open(RECORD_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)
    return jsonify(records)

# ------------------------------
# 获取用户信息
# ------------------------------
@app.route("/api/userinfo")
def get_userinfo():
    with open(USER_FILE, "r", encoding="utf-8") as f:
        user = json.load(f)
    return jsonify(user)

# ------------------------------
# 启动服务
# ------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
