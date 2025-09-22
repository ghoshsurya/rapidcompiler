from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import docker
import tempfile
import os
import time
import uuid
from datetime import datetime
from functools import wraps
import jwt as pyjwt
import requests

app = Flask(__name__)
CORS(app)

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv('AUTH0_DOMAIN')
AUTH0_AUDIENCE = os.getenv('AUTH0_AUDIENCE')

# Neon Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def verify_auth0_token(token):
    try:
        jwks_url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
        jwks = requests.get(jwks_url).json()
        
        unverified_header = pyjwt.get_unverified_header(token)
        
        rsa_key = {}
        for key in jwks['keys']:
            if key['kid'] == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }
        
        if rsa_key:
            payload = pyjwt.decode(
                token,
                rsa_key,
                algorithms=['RS256'],
                audience=AUTH0_AUDIENCE,
                issuer=f'https://{AUTH0_DOMAIN}/'
            )
            return payload
        
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        payload = verify_auth0_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated

# Language configurations
LANGUAGE_CONFIG = {
    'python': {
        'image': 'python:3.9-alpine',
        'cmd': ['python', '-c'],
        'extension': '.py'
    },
    'javascript': {
        'image': 'node:16-alpine',
        'cmd': ['node', '-e'],
        'extension': '.js'
    },
    'c': {
        'image': 'gcc:latest',
        'compile_cmd': ['gcc', '-o', '/tmp/program', '/tmp/code.c'],
        'run_cmd': ['/tmp/program'],
        'extension': '.c'
    },
    'cpp': {
        'image': 'gcc:latest',
        'compile_cmd': ['g++', '-o', '/tmp/program', '/tmp/code.cpp'],
        'run_cmd': ['/tmp/program'],
        'extension': '.cpp'
    },
    'java': {
        'image': 'openjdk:11-alpine',
        'compile_cmd': ['javac', '/tmp/Main.java'],
        'run_cmd': ['java', '-cp', '/tmp', 'Main'],
        'extension': '.java'
    }
}

def execute_code(language, code, input_data=""):
    if language not in LANGUAGE_CONFIG:
        return {"error": "Unsupported language"}
    
    config = LANGUAGE_CONFIG[language]
    client = docker.from_env()
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            if language in ['c', 'cpp', 'java']:
                filename = f"code{config['extension']}"
                if language == 'java':
                    filename = "Main.java"
                
                code_file = os.path.join(temp_dir, filename)
                with open(code_file, 'w') as f:
                    f.write(code)
                
                # Compile
                client.containers.run(
                    config['image'],
                    config['compile_cmd'],
                    volumes={temp_dir: {'bind': '/tmp', 'mode': 'rw'}},
                    mem_limit='128m',
                    remove=True,
                    timeout=10
                )
                
                # Run
                result = client.containers.run(
                    config['image'],
                    config['run_cmd'],
                    volumes={temp_dir: {'bind': '/tmp', 'mode': 'rw'}},
                    mem_limit='128m',
                    network_disabled=True,
                    remove=True,
                    timeout=10,
                    input=input_data.encode() if input_data else None
                )
            else:
                result = client.containers.run(
                    config['image'],
                    config['cmd'] + [code],
                    mem_limit='128m',
                    network_disabled=True,
                    remove=True,
                    timeout=10,
                    input=input_data.encode() if input_data else None
                )
            
            return {"output": result.decode('utf-8'), "error": None}
    
    except docker.errors.ContainerError as e:
        return {"output": "", "error": e.stderr.decode('utf-8') if e.stderr else str(e)}
    except Exception as e:
        return {"output": "", "error": str(e)}

# Routes
@app.route('/api/run', methods=['POST'])
def run_code():
    data = request.get_json()
    language = data.get('language')
    code = data.get('code')
    input_data = data.get('input', '')
    
    if not language or not code:
        return jsonify({"error": "Language and code are required"}), 400
    
    result = execute_code(language, code, input_data)
    return jsonify(result)

@app.route('/api/users/<user_id>', methods=['GET'])
@auth_required
def get_user_profile(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user[0],
        "email": user[1],
        "username": user[2],
        "full_name": user[3],
        "avatar_url": user[4],
        "is_admin": user[5],
        "created_at": user[6].isoformat()
    })

@app.route('/api/users', methods=['POST'])
@auth_required
def create_user_profile():
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO users (id, email, username, full_name, avatar_url, is_admin, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
    """, (
        data['id'],
        data['email'],
        data['username'],
        data.get('full_name', ''),
        data.get('avatar_url'),
        data.get('is_admin', False),
        datetime.utcnow()
    ))
    
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        "id": user[0],
        "email": user[1],
        "username": user[2],
        "full_name": user[3],
        "avatar_url": user[4],
        "is_admin": user[5],
        "created_at": user[6].isoformat()
    })

@app.route('/api/projects', methods=['GET', 'POST'])
@auth_required
def projects():
    user_id = request.current_user['sub']
    conn = get_db_connection()
    cur = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        project_id = str(uuid.uuid4())
        share_id = str(uuid.uuid4())
        
        cur.execute("""
            INSERT INTO projects (id, user_id, title, language, code, share_id, is_public, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            project_id,
            user_id,
            data.get('title'),
            data.get('language'),
            data.get('code'),
            share_id,
            False,
            datetime.utcnow(),
            datetime.utcnow()
        ))
        
        project = cur.fetchone()
        conn.commit()
        
        result = {
            "id": project[0],
            "title": project[2],
            "language": project[3],
            "share_id": project[5]
        }
    else:
        cur.execute("SELECT * FROM projects WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        projects = cur.fetchall()
        
        result = [{
            "id": p[0],
            "title": p[2],
            "language": p[3],
            "share_id": p[5],
            "created_at": p[7].isoformat()
        } for p in projects]
    
    cur.close()
    conn.close()
    return jsonify(result)

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "database": "neon"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)