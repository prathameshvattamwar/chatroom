from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from models import db, User, Message
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# File upload configuration
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chatroom.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Home Route (Main Chatroom)
@app.route('/')
def index():
    if 'username' in session:
        messages = Message.query.all()
        return render_template('index.html', messages=messages)
    return render_template('index.html')

# Signup Route
@app.route('/signup', methods=['POST'])
def signup():
    try:
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        # Handle file upload
        profile_image_filename = None
        if 'profile_image' in request.files and request.files['profile_image']:
            profile_image = request.files['profile_image']
            if profile_image and allowed_file(profile_image.filename):
                filename = secure_filename(profile_image.filename)
                profile_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                profile_image_filename = f'uploads/{filename}'

        # Check if passwords match
        if password != confirm_password:
            return "Passwords do not match!", 400

        # Case-insensitive check if username or email already exists
        existing_user = User.query.filter((User.username.ilike(username)) | (User.email.ilike(email))).first()
        if existing_user:
            return "User with this username or email already exists!", 400

        # Create a new user and save to the database
        new_user = User(username=username, email=email, password=password, profile_image=profile_image_filename)
        db.session.add(new_user)
        db.session.commit()

        return redirect(url_for('index'))
    
    except SQLAlchemyError as e:
        db.session.rollback()  # Rollback in case of any error during the transaction
        print(f"Database error during signup: {e}")  # Log the detailed error
        return "An error occurred during signup. Please try again.", 500
    
    except Exception as e:
        print(f"Error during signup: {e}")  # Catch other general exceptions
        return "An error occurred during signup. Please try again.", 500

# Login Route
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    user = User.query.filter_by(username=username, password=password).first()
    if user:
        session['username'] = username
        return redirect(url_for('index'))
    return "Invalid credentials!"

# Logout Route
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('index'))

# Send Message Route
@app.route('/send_message', methods=['POST'])
def send_message():
    if 'username' in session:
        user = User.query.filter_by(username=session['username']).first()
        content = request.form['message']
        new_message = Message(username=session['username'], content=content, profile_image=user.profile_image)
        db.session.add(new_message)
        db.session.commit()
    return redirect(url_for('index'))

# Delete Message Route
@app.route('/delete_message/<int:message_id>', methods=['POST'])
def delete_message(message_id):
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 403

    message = Message.query.get(message_id)
    if message and message.username == session['username']:
        try:
            db.session.delete(message)
            db.session.commit()
            return jsonify({"success": True}), 200
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({"error": "Database error"}), 500
    return jsonify({"error": "Message not found or unauthorized"}), 404

if __name__ == '__main__':
    app.run(debug=True)
