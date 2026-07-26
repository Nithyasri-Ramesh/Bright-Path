from flask import Blueprint, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
from .utils import describe_item_with_gemini

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        # Analyze image
        description = describe_item_with_gemini(temp_path)
        
        # Clean up
        os.remove(temp_path)
        os.rmdir(temp_dir)
        
        return jsonify({
            'success': True,
            'description': description
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500