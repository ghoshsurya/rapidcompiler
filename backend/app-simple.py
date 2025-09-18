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
    'java': {
        'compile_cmd': ['javac'],
        'run_cmd': ['java'],
        'extension': '.java'
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
                    
        elif language == 'java':
            # Create temporary directory and file
            temp_dir = tempfile.mkdtemp()
            java_file = os.path.join(temp_dir, 'Main.java')
            
            try:
                # Write Java code
                with open(java_file, 'w') as f:
                    f.write(code)
                
                # Compile
                compile_result = subprocess.run(
                    config['compile_cmd'] + [java_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=temp_dir
                )
                
                if compile_result.returncode != 0:
                    return {"output": "", "error": f"Compilation Error: {compile_result.stderr}"}
                
                # Execute
                result = subprocess.run(
                    config['run_cmd'] + ['Main'],
                    input=input_data,
                    text=True,
                    capture_output=True,
                    timeout=10,
                    cwd=temp_dir
                )
                
            finally:
                # Cleanup
                import shutil
                try:
                    shutil.rmtree(temp_dir)
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
        elif 'javac' in str(e) or 'java' in str(e):
            return {"output": "", "error": "Java compiler not found. Please install JDK."}
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
    
    if not language or not code:
        return jsonify({"error": "Language and code are required"}), 400
    
    result = execute_code_local(language, code, input_data)
    return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Backend is running"})

if __name__ == '__main__':
    print("Starting OnlineGDB Backend...")
    print("Supported languages: Python, JavaScript, C, C++, Java")
    print("Note: C/C++ requires GCC/MinGW, Java requires JDK")
    print("Access at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)