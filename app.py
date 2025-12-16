from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from mysql_config import MySQLDatabase
import os
import re

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

db = MySQLDatabase()

# Serve all HTML pages
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/login.html')
def serve_login():
    return send_from_directory('.', 'login.html')

@app.route('/register.html')
def serve_register():
    return send_from_directory('.', 'register.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Data harus dalam format JSON!'
            }), 400

        # Validation
        required_fields = ['username', 'password', 'email', 'phone']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'Field {field} harus diisi!'
                }), 400
        
        if len(data['username']) < 3:
            return jsonify({
                'success': False,
                'message': 'Username minimal 3 karakter!'
            }), 400
            
        if len(data['password']) < 6:
            return jsonify({
                'success': False,
                'message': 'Password minimal 6 karakter!'
            }), 400
        
        # Email validation
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, data['email']):
            return jsonify({
                'success': False,
                'message': 'Format email tidak valid!'
            }), 400
        
        # Check if user exists
        exists = db.check_user_exists(data['username'], data['email'])
        if exists == "username":
            return jsonify({
                'success': False,
                'message': 'Username sudah digunakan!'
            }), 400
        elif exists == "email":
            return jsonify({
                'success': False,
                'message': 'Email sudah terdaftar!'
            }), 400
        elif exists == "error":
            return jsonify({
                'success': False,
                'message': 'Error checking user existence!'
            }), 500
        
        # Register user
        if db.register_user(data):
            return jsonify({
                'success': True,
                'message': 'Registrasi berhasil! Silakan login.'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Gagal melakukan registrasi. Coba lagi.'
            }), 500
            
    except Exception as e:
        print(f"❌ Register error: {e}")
        return jsonify({
            'success': False,
            'message': f'Terjadi kesalahan server: {str(e)}'
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Data harus dalam format JSON!'
            }), 400

        # Validation
        if 'username' not in data or 'password' not in data or not data['username'] or not data['password']:
            return jsonify({
                'success': False,
                'message': 'Username dan password harus diisi!'
            }), 400
        
        # Login user
        user = db.login_user(data['username'], data['password'])
        if user:
            return jsonify({
                'success': True,
                'message': f'Login berhasil! Selamat datang, {user["username"]}!',
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'phone': user['phone']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Username atau password salah!'
            }), 401
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({
            'success': False,
            'message': f'Terjadi kesalahan server: {str(e)}'
        }), 500

@app.route('/api/test-db')
def test_database():
    success = db.test_connection()
    return jsonify({
        'success': success,
        'message': 'Database test completed'
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy', 
        'framework': 'Flask',
        'endpoints': {
            'register': '/api/register',
            'login': '/api/login', 
            'test_db': '/api/test-db',
            'health': '/api/health'
        }
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Flask MySQL Server - FULL VERSION")
    print("📊 Testing database connection...")
    
    db.test_connection()
    
    print("🌐 Available Routes:")
    print("   📄 /              -> index.html")
    print("   📄 /login.html    -> login.html") 
    print("   📄 /register.html -> register.html")
    print("   🔗 /api/register  -> Register API")
    print("   🔗 /api/login     -> Login API")
    print("   🔗 /api/health    -> Health Check")
    print("")
    print("🌐 Server: http://localhost:5000")
    print("⏹️  Tekan Ctrl+C untuk menghentikan server")
    print("=" * 60)
    
    app.run(debug=True, port=5000)