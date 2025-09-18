from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
import docker
import tempfile
import os
import subprocess
import time
import bcrypt
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost/onlinegdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
jwt = JWTManager(app)
db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    language = db.Column(db.String(50), nullable=False)
    code = db.Column(db.Text, nullable=False)
    share_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
    """Execute code in Docker container with security limits"""
    if language not in LANGUAGE_CONFIG:
        return {"error": "Unsupported language"}
    
    config = LANGUAGE_CONFIG[language]
    client = docker.from_env()
    
    try:
        # Create temporary files
        with tempfile.TemporaryDirectory() as temp_dir:
            if language in ['c', 'cpp']:
                filename = f"code{config['extension']}"
                if language == 'java':
                    filename = "Main.java"
                
                code_file = os.path.join(temp_dir, filename)
                with open(code_file, 'w') as f:
                    f.write(code)
                
                # Compile step
                compile_result = client.containers.run(
                    config['image'],
                    config['compile_cmd'],
                    volumes={temp_dir: {'bind': '/tmp', 'mode': 'rw'}},
                    mem_limit='128m',
                    cpu_period=100000,
                    cpu_quota=50000,
                    network_disabled=True,
                    remove=True,
                    timeout=10
                )
                
                # Run compiled program
                result = client.containers.run(
                    config['image'],
                    config['run_cmd'],
                    volumes={temp_dir: {'bind': '/tmp', 'mode': 'rw'}},
                    stdin_open=True,
                    mem_limit='128m',
                    cpu_period=100000,
                    cpu_quota=50000,
                    network_disabled=True,
                    remove=True,
                    timeout=10,
                    input=input_data.encode() if input_data else None
                )
            
            elif language == 'java':
                code_file = os.path.join(temp_dir, "Main.java")
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
            
            else:  # Python, JavaScript
                result = client.containers.run(
                    config['image'],
                    config['cmd'] + [code],
                    mem_limit='128m',
                    cpu_period=100000,
                    cpu_quota=50000,
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

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user = User(username=username, email=email, password_hash=password_hash)
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({"access_token": access_token, "user": {"id": user.id, "username": username}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash):
        access_token = create_access_token(identity=user.id)
        return jsonify({"access_token": access_token, "user": {"id": user.id, "username": username}})
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/projects', methods=['GET', 'POST'])
@jwt_required()
def projects():
    user_id = get_jwt_identity()
    
    if request.method == 'POST':
        data = request.get_json()
        project = Project(
            user_id=user_id,
            title=data.get('title'),
            language=data.get('language'),
            code=data.get('code')
        )
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            "id": project.id,
            "title": project.title,
            "language": project.language,
            "share_id": project.share_id
        })
    
    projects = Project.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": p.id,
        "title": p.title,
        "language": p.language,
        "share_id": p.share_id,
        "created_at": p.created_at.isoformat()
    } for p in projects])

@app.route('/api/projects/<int:project_id>', methods=['GET', 'PUT'])
@jwt_required()
def project_detail(project_id):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    if request.method == 'PUT':
        data = request.get_json()
        project.title = data.get('title', project.title)
        project.code = data.get('code', project.code)
        project.language = data.get('language', project.language)
        project.updated_at = datetime.utcnow()
        db.session.commit()
    
    return jsonify({
        "id": project.id,
        "title": project.title,
        "language": project.language,
        "code": project.code,
        "share_id": project.share_id
    })

@app.route('/api/share/<share_id>')
def get_shared_project(share_id):
    project = Project.query.filter_by(share_id=share_id, is_public=True).first()
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    return jsonify({
        "title": project.title,
        "language": project.language,
        "code": project.code
    })

@app.route('/api/projects/<int:project_id>/share', methods=['POST'])
@jwt_required()
def share_project(project_id):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    project.is_public = True
    db.session.commit()
    
    return jsonify({"share_url": f"/share/{project.share_id}"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)