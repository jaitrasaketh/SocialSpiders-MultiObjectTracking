import React, { useRef, useState, useEffect } from 'react';
import './VideoPlayer.css';

function VideoPlayer({ csvFile }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editMode, setEditMode] = useState(null); // 'redraw' or 'edit-id'
  const [showIdPopup, setShowIdPopup] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [newId, setNewId] = useState("");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [bbox, setBbox] = useState(null); // Stores bounding box coordinates
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null); // Ref for requestAnimationFrame

  const frameRate = 30;

  useEffect(() => {
    setCsvUploaded(csvFile);
  }, [csvFile]);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setProgress(0);
      setIsPlaying(false);
    } else {
      alert('Please upload a valid video file.');
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        cancelAnimationFrame(animationRef.current);
      } else {
        videoRef.current.play();
        requestFrameUpdate();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSliderChange = (event) => {
    const newProgress = event.target.value;
    setProgress(newProgress);
    if (videoRef.current) {
      videoRef.current.currentTime = (videoRef.current.duration * newProgress) / 100;
    }
  };

  const requestFrameUpdate = () => {
    if (videoRef.current && !videoRef.current.paused) {
      const currentFrame = Math.floor(videoRef.current.currentTime * frameRate);
      setCurrentFrame(currentFrame);
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
      animationRef.current = requestAnimationFrame(requestFrameUpdate);
    }
  };

  const handleEditOptionChange = (event) => {
    if (!csvUploaded) {
      alert('Please upload a CSV file before editing.');
      return;
    }

    const selectedOption = event.target.value;
    if (selectedOption === 'redraw') {
      handleRedrawBoundingBox();
    } else if (selectedOption === 'edit-id') {
      handleEditId();
    }
  };

  const handleRedrawBoundingBox = () => {
    setEditMode('redraw');
    if (videoRef.current) videoRef.current.pause();
    cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  };

  const handleEditId = () => {
    setEditMode('edit-id');
    setShowIdPopup(true);
    if (videoRef.current) videoRef.current.pause();
    cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  };

  const handleMouseDown = (e) => {
    if (editMode === 'redraw') {
      const rect = canvasRef.current.getBoundingClientRect();
      setBbox({
        x1: e.clientX - rect.left,
        y1: e.clientY - rect.top,
        x2: null,
        y2: null,
      });
      setDrawing(true);
    }
  };

  const handleMouseMove = (e) => {
    if (drawing && editMode === 'redraw') {
      const rect = canvasRef.current.getBoundingClientRect();
      setBbox((prevBbox) => ({
        ...prevBbox,
        x2: e.clientX - rect.left,
        y2: e.clientY - rect.top,
      }));
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
    // Optional: Send bounding box data to backend or process it as needed
    console.log("Bounding box:", bbox);
  };

  const handleSaveId = async () => {
    try {
      const response = await fetch(`http://localhost:5000/update-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFrame: currentFrame,
          currentId: currentId,
          newId: newId,
        }),
      });

      if (response.ok) {
        console.log("ID updated successfully");
      } else {
        console.error("Failed to update ID");
      }
    } catch (error) {
      console.error("Error updating ID:", error);
    }

    setShowIdPopup(false);
    setEditMode(null);
    setCurrentId("");
    setNewId("");
    if (videoRef.current) {
      videoRef.current.play();
      requestFrameUpdate();
    }
    setIsPlaying(true);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:5000/download-updated-csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'updated_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Error downloading the updated CSV file.");
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div className="video-player">
      {!videoSrc && (
        <>
          <label htmlFor="video-upload" className="upload-btn">Upload Video</label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleVideoUpload}
          />
        </>
      )}

      {videoSrc && (
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{ position: 'relative', width: '100%' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <video
              ref={videoRef}
              className="video-element"
              src={videoSrc}
              onEnded={() => setIsPlaying(false)}
              controls={false}
              style={{ filter: editMode ? 'brightness(0.8)' : 'none' }}
            />
            {editMode && <div className="dimming-overlay"></div>}
            <canvas
              ref={canvasRef}
              className="bounding-box-canvas"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            />
            {bbox && bbox.x2 && bbox.y2 && (
              <div
                style={{
                  position: 'absolute',
                  border: '2px solid blue',
                  left: Math.min(bbox.x1, bbox.x2),
                  top: Math.min(bbox.y1, bbox.y2),
                  width: Math.abs(bbox.x2 - bbox.x1),
                  height: Math.abs(bbox.y2 - bbox.y1),
                }}
              />
            )}
          </div>

          <div className="controls">
            <button onClick={togglePlayPause} className="upload-btn">
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSliderChange}
              className="timeline-slider"
            />
            <span className="frame-display">Frame: {currentFrame}</span>
          </div>

          <div className="save-download">
            <select onChange={handleEditOptionChange} className="edit-dropdown">
              <option value="">Select Edit Option</option>
              <option value="redraw">Redraw Bounding Boxes</option>
              <option value="edit-id">Edit ID</option>
            </select>

            <button className="save-btn" onClick={handleSaveId}>Save</button>
            <button className="download-btn" onClick={handleDownload}>Download</button>
          </div>
        </div>
      )}

      {showIdPopup && (
        <div className="id-popup">
          <h3>Update ID</h3>
          <input
            type="text"
            placeholder="Current ID"
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
          />
          <input
            type="text"
            placeholder="New ID"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
          <button onClick={handleSaveId}>Save ID</button>
          <button onClick={() => { setShowIdPopup(false); setEditMode(null); }}>Close</button>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
