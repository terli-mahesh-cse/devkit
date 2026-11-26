# DevKit Flask API - Phase 7 verified
import os
import json
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_no_cache(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/format-json", methods=["POST"])
def format_json():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    indent = data.get("indent", 2)
    sort_keys = bool(data.get("sort_keys", False))

    if indent == "tab":
        indent_val = "\t"
    else:
        try:
            indent_val = int(indent)
        except (ValueError, TypeError):
            indent_val = 2

    if not text.strip():
        return jsonify({"ok": False, "error": "Empty input"}), 400

    try:
        parsed = json.loads(text)
        formatted = json.dumps(parsed, indent=indent_val, sort_keys=sort_keys)
        return jsonify({"ok": True, "value": formatted})
    except json.JSONDecodeError as err:
        err_msg = f"{err.msg} at line {err.lineno}, column {err.colno}"
        return jsonify({"ok": False, "error": err_msg}), 400
    except Exception as err:
        return jsonify({"ok": False, "error": str(err)}), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Never enable debug mode in production
    is_dev = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=is_dev)
