from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os

import cv2
from io import BytesIO
import zipfile 


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
csv_file_path = os.path.join(UPLOAD_FOLDER, 'uploaded_data.csv')
updated_csv_path = os.path.join(UPLOAD_FOLDER, 'updated_data.csv')

# Load the CSV into a DataFrame when uploaded
df = None  # This will hold the DataFrame

@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    global df
    if 'csvFile' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})

    file = request.files['csvFile']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})

    if file and file.filename.endswith('.csv'):
        # Save CSV file and load it into a DataFrame
        file.save(csv_file_path)
        df = pd.read_csv(csv_file_path)
        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'File format not supported'})
  

@app.route('/update-id', methods=['POST'])
def update_id():
    global df
    data = request.json
    current_id = data.get('currentId')
    new_id = data.get('newId')
    frame = data.get('currentFrame')  # Frame number for specific row filtering

    if not all([current_id, new_id, frame]):
        return jsonify({'success': False, 'error': 'Invalid data'})

    try:
        # Update `track_id` for rows matching the current ID and frame
        df.loc[(df['track_id'] == int(current_id)) & (df['frame'] == int(frame)), 'track_id'] = int(new_id)
        return jsonify({'success': True})
    except Exception as e:
        print("Error updating ID:", e)
        return jsonify({'success': False, 'error': str(e)})


# @app.route('/download-updated-csv', methods=['GET'])
# def download_updated_csv():
#     global df
#     try:
#         # Save the updated DataFrame to a new CSV file for download
#         df.to_csv(updated_csv_path, index=False)
#         return send_file(updated_csv_path, as_attachment=True)
#     except Exception as e:
#         print("Error preparing file for download:", e)
#         return jsonify({'success': False, 'error': str(e)})


if __name__ == '__main__':
    app.run(port=5000, debug=True)
