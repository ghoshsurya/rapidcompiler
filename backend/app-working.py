from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import os
import time
import shutil

app = Flask(__name__)
CORS(app)

# Language configurations for local execution
LANGUAGE_CONFIG = {
    'python': {
        'cmd': ['python', '-c'],
        'extension': '.py'
    },
    'javascript': {
        'cmd': ['node', '-e'],
        'extension': '.js'
    },
    'c': {
        'compile_cmd': ['gcc', '-o'],
        'extension': '.c'
    },
    'cpp': {
        'compile_cmd': ['g++', '-o'],
        'extension': '.cpp'
    },
    'web': {
        'extension': '.html'
    }
}

def execute_code_local(language, code, input_data=""):
    """Execute code locally with basic security"""
    if language not in LANGUAGE_CONFIG:
        return {"error": "Unsupported language"}
    
    config = LANGUAGE_CONFIG[language]
    
    try:
        if language == 'python':
            result = subprocess.run(
                config['cmd'] + [code],
                input=input_data,
                text=True,
                capture_output=True,
                timeout=10
            )
            
        elif language == 'javascript':
            result = subprocess.run(
                config['cmd'] + [code],
                input=input_data,
                text=True,
                capture_output=True,
                timeout=10
            )
            
        elif language == 'web':
            # Create HTML file with embedded CSS/JS
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as html_file:
                html_file.write(code)
                html_path = html_file.name
            
            # Return file path for frontend to open
            return {"output": f"Web page created: file:///{html_path.replace(chr(92), '/')}", "error": None, "html_path": html_path}
                
        elif language in ['c', 'cpp']:
            # Create temporary files
            with tempfile.NamedTemporaryFile(mode='w', suffix=config['extension'], delete=False) as source_file:
                source_file.write(code)
                source_path = source_file.name
            
            exe_path = source_path.replace(config['extension'], '.exe')
            
            try:
                # Compile
                compile_result = subprocess.run(
                    config['compile_cmd'] + [exe_path, source_path],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if compile_result.returncode != 0:
                    return {"output": "", "error": f"Compilation Error: {compile_result.stderr}"}
                
                # Execute
                result = subprocess.run(
                    [exe_path],
                    input=input_data,
                    text=True,
                    capture_output=True,
                    timeout=10
                )
                
            finally:
                # Cleanup
                try:
                    os.unlink(source_path)
                    if os.path.exists(exe_path):
                        os.unlink(exe_path)
                except:
                    pass
        
        if result.returncode == 0:
            return {"output": result.stdout, "error": None}
        else:
            return {"output": "", "error": result.stderr}
    
    except subprocess.TimeoutExpired:
        return {"output": "", "error": "Execution timeout (10s limit)"}
    except FileNotFoundError as e:
        if 'gcc' in str(e) or 'g++' in str(e):
            return {"output": "", "error": "C/C++ compiler not found. Please install MinGW or GCC."}
        else:
            return {"output": "", "error": str(e)}
    except Exception as e:
        return {"output": "", "error": str(e)}

@app.route('/api/run', methods=['POST'])
def run_code():
    data = request.get_json()
    language = data.get('language')
    code = data.get('code')
    input_data = data.get('input', '')
    
    print(f"Received language: '{language}'")
    print(f"Available languages: {list(LANGUAGE_CONFIG.keys())}")
    
    if not language or not code:
        return jsonify({"error": "Language and code are required"}), 400
    
    result = execute_code_local(language, code, input_data)
    return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route('/api/preview/<path:filename>')
def preview_web(filename):
    """Serve HTML files for web preview"""
    try:
        with open(filename, 'r') as f:
            content = f.read()
        return content, 200, {'Content-Type': 'text/html'}
    except:
        return "File not found", 404

if __name__ == '__main__':
    print("Starting OnlineGDB Backend...")
    print("Supported languages: Python, JavaScript, C, C++, HTML/CSS/JS")
    print("Note: C/C++ requires GCC/MinGW, Web creates viewable HTML files")
    print("Access at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)