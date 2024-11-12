from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

# Path to your CSV file
csv_file_path = 'path/to/your/csv_file.csv'
data = pd.read_csv(csv_file_path)

@app.route('/update-bounding-box', methods=['POST'])
def update_bounding_box():
    try:
        # Extract data from the request
        frame_id = request.json.get('frame_id')
        track_id = request.json.get('track_id')
        class_id = request.json.get('class_id')
        x1 = request.json.get('x1')
        y1 = request.json.get('y1')
        x2 = request.json.get('x2')
        y2 = request.json.get('y2')

        # Validate data
        if not all([frame_id, track_id, class_id, x1, y1, x2, y2]):
            return jsonify({"error": "Incomplete data provided."}), 400

        # Find the row in the CSV matching frame_id, track_id, and class_id
        row_idx = data[
            (data['frame'] == frame_id) &
            (data['track_id'] == track_id) &
            (data['class_id'] == class_id)
        ].index

        if len(row_idx) == 0:
            return jsonify({"error": "No matching entry found in CSV."}), 404

        # Update coordinates in the CSV data
        data.loc[row_idx, ['x1', 'y1', 'x2', 'y2']] = [x1, y1, x2, y2]

        # Save the updated CSV file
        data.to_csv(csv_file_path, index=False)

        return jsonify({"message": "Bounding box updated successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
