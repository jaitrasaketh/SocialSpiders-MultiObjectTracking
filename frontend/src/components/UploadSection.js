import React from 'react';
import axios from 'axios';

function UploadSection({ onCsvUpload }) {

  const handleCsvUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const formData = new FormData();
      formData.append('csvFile', file);

      try {
        const response = await axios.post('http://127.0.0.1:5000/upload-csv', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.data.success) {
          onCsvUpload(file); // Set CSV file locally if upload is successful
          // onCsvUploadSuccess(response.data.csv_content); // Notify parent component of upload
          alert('CSV file uploaded successfully.');
        } else {
          alert('Error uploading CSV file.');
        }
      } catch (error) {
        console.error('CSV upload error:', error);
        alert('Error uploading CSV file.');
      }
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  return (
    <div className="upload-section">
      <label htmlFor="csv-upload" className="upload-btn">Upload CSV</label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleCsvUpload}
      />
    </div>
  );
}

export default UploadSection;
