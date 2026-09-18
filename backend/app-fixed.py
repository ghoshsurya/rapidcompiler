from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/run', methods=['POST'])
def run_code():
    data = request.get_json()
    language = data.get('language')
    code = data.get('code')
    input_data = data.get('input', '')
    
    print(f"Language: {language}")
    
    if language == 'web':
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(code)
            path = f.name
        return jsonify({"output": f"Web page: file:///{path.replace(chr(92), '/')}", "error": None})
    
    elif language == 'python':
        result = subprocess.run(['python', '-c', code], input=input_data, text=True, capture_output=True, timeout=10)
        return jsonify({"output": result.stdout, "error": result.stderr if result.returncode != 0 else None})
    
    elif language == 'javascript':
        result = subprocess.run(['node', '-e', code], input=input_data, text=True, capture_output=True, timeout=10)
        return jsonify({"output": result.stdout, "error": result.stderr if result.returncode != 0 else None})
    
    elif language == 'php':
        return jsonify({"output": "PHP preview ready", "error": None})
    
    else:
        return jsonify({"error": "Unsupported language"})

if __name__ == '__main__':
    print("Supported: Python, JavaScript, PHP (preview), HTML/CSS/JS")
    app.run(debug=True, host='0.0.0.0', port=5000)