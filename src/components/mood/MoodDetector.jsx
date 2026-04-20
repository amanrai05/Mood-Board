import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, X, Check } from 'lucide-react';
import { mapExpressionToMood } from '../../utils/moodUtils';
import './MoodDetector.css';

const MoodDetector = ({ onDetect, onCancel }) => {
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [detectInterval, setDetectInterval] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        setIsModelsLoaded(true);
        startVideo();
      } catch (err) {
        console.error("Failed to load models", err);
        setError("Failed to load AI models. Please make sure they are downloaded to public/models.");
      }
    };

    loadModels();

    return () => {
      stopVideo();
      if (detectInterval) clearInterval(detectInterval);
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Failed to get video stream", err);
        setError("Could not access the webcam. Please allow camera permissions.");
      });
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleVideoPlay = () => {
    if (!isModelsLoaded) return;
    setIsDetecting(true);

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      try {
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 })
        ).withFaceExpressions();

        if (detection) {
          const result = mapExpressionToMood(detection.expressions);
          setCurrentResult(result);
        } else {
          setCurrentResult(null);
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 300);
    
    setDetectInterval(interval);
  };

  const handleCapture = () => {
    if (currentResult) {
      if (detectInterval) clearInterval(detectInterval);
      stopVideo();
      onDetect(currentResult);
    }
  };

  return (
    <div className="mood-detector">
      <div className="mood-detector-header">
        <h4><Camera size={18} /> AI Mood Detection</h4>
        <button onClick={() => { stopVideo(); onCancel(); }} className="close-btn" title="Cancel">
          <X size={18} />
        </button>
      </div>
      
      {error ? (
        <div className="mood-detector-error">{error}</div>
      ) : (
        <div className="video-container" style={{ position: 'relative' }}>
          {!isModelsLoaded && <div className="loading-overlay">Loading AI Models...</div>}
          {isModelsLoaded && !currentResult && isDetecting && <div className="loading-overlay transparent">Detecting face...</div>}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            onPlay={handleVideoPlay}
            className="video-feed"
            style={{ borderRadius: '8px', width: '100%' }}
          />
          
          {currentResult && (
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              backdropFilter: 'blur(4px)',
              width: '85%'
            }}>
              <div style={{ fontSize: '2rem' }}>{currentResult.emoji}</div>
              <div style={{ fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
                {currentResult.note}
              </div>
            </div>
          )}
        </div>
      )}

      {!error && (
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleCapture}
            disabled={!currentResult}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              background: currentResult ? 'var(--accent-600)' : 'var(--border)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: currentResult ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            <Camera size={20} /> Capture Emotion
          </button>
        </div>
      )}
    </div>
  );
};

export default MoodDetector;
