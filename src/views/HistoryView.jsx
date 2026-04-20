import MoodPicker from '../components/mood/MoodPicker';
import HistoryList from '../components/history/HistoryList';
import MoodDetector from '../components/mood/MoodDetector';
import { Camera, Mic, Square, Sparkles, Brain, Music, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../components/ui/ToastProvider';
import { getAIInsights } from '../utils/aiInsights';
import { useSpeechToText } from '../utils/useSpeechToText';
import apiService from '../services/api';

const HistoryView = ({ pastEntries, loading, error, onMoodSelect, onDelete, onEdit, renderOnlyHeader = false }) => {
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeString = currentDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const [showMoodDetector, setShowMoodDetector] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null); // 'detect' | 'spotify' | 'therapist'
  const [insights, setInsights] = useState(null);
  
  const { show } = useToast();
  const { isRecording, transcript, toggleRecording, clearTranscript, supported: speechSupported } = useSpeechToText();

  const handleFeatureClick = (feature) => {
    setActiveFeature(feature);
    setShowMoodDetector(true);
    setInsights(null);
  };

  const handleAIDetect = (result) => {
    setShowMoodDetector(false);
    
    if (activeFeature === 'spotify' || activeFeature === 'therapist') {
      const generatedInsights = getAIInsights(result.mood, "Detected via facial scan.");
      setInsights({ ...generatedInsights, active: activeFeature, emoji: result.emoji, mood: result.mood });
      show(`Facial scan complete! ${result.emoji}`, 'success');
      return;
    }

    // Default Face Detect logic
    show(`Detected expression! ${result.emoji}`, 'success');
    if (typeof onMoodSelect === 'function') {
      onMoodSelect({
        mood: result.mood,
        isAutoDetected: true,
        aiResult: result
      });
    }
  };

  const handleSaveVoiceEntry = async () => {
    if (!transcript) {
      show("Nothing was recorded.", "error");
      return;
    }
    
    try {
      const now = new Date();
      await apiService.createMoodEntry({
        mood: 3, // Default neutral for quick voice
        date: now.toLocaleDateString(),
        time: now.toISOString(),
        content: transcript,
        selected_options: [],
      });
      show('Voice entry saved successfully!', 'success');
      clearTranscript();
      if (typeof onEdit === 'function') onEdit(); // trigger refresh
    } catch (e) {
      show('Failed to save voice entry.', 'error');
    }
  };

  return (
    <>
  <div className="history-header" style={{ position: 'relative' }}>
        {showMoodDetector ? (
          <MoodDetector 
            onDetect={handleAIDetect} 
            onCancel={() => setShowMoodDetector(false)} 
          />
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleFeatureClick('detect')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem',
                  background: 'transparent', color: 'var(--accent-600)', border: '1px solid var(--accent-600)',
                  borderRadius: '999px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                }}
              >
                <Camera size={14} /> Auto-Detect
              </button>

              <button
                onClick={() => handleFeatureClick('spotify')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem',
                  background: 'transparent', color: '#1DB954', border: '1px solid #1DB954',
                  borderRadius: '999px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                }}
              >
                <Music size={14} /> Spotify Match
              </button>

              <button
                onClick={() => handleFeatureClick('therapist')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem',
                  background: 'transparent', color: 'var(--mood-4)', border: '1px solid var(--mood-4)',
                  borderRadius: '999px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                }}
              >
                <Brain size={14} /> AI Therapist
              </button>

              {speechSupported && (
                <button
                  onClick={toggleRecording}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem',
                    background: isRecording ? '#ff4b4b' : 'transparent', 
                    color: isRecording ? 'white' : 'var(--text)', 
                    border: isRecording ? 'none' : '1px solid var(--border)',
                    borderRadius: '999px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                    animation: isRecording ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {isRecording ? <Square size={14} /> : <Mic size={14} />}
                  {isRecording ? 'Stop Recording' : 'Voice Entry'}
                </button>
              )}
            </div>

            {/* AI Insights Displays */}
            {insights && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                background: insights.active === 'spotify' ? 'linear-gradient(to bottom right, rgba(29, 185, 84, 0.1), transparent)' : 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), transparent)',
                border: `1px solid ${insights.active === 'spotify' ? '#1DB954' : 'var(--accent-600)'}`,
                borderRadius: '16px',
                position: 'relative'
              }}>
                <button 
                  onClick={() => setInsights(null)} 
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
                >
                  <X size={16} />
                </button>
                <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>{insights.emoji}</div>
                
                {insights.active === 'spotify' ? (
                  <>
                    <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: '#1DB954' }}>
                      <Music size={18} /> Vibe Matched Playlist
                    </h4>
                    {insights.playlistUrl && (
                      <iframe 
                        style={{ borderRadius: '12px', border: 'none' }} 
                        src={insights.playlistUrl} 
                        width="100%" height="80" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy" title="Spotify Playlist"
                      ></iframe>
                    )}
                  </>
                ) : (
                  <>
                    <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: 'var(--accent-600)' }}>
                      <Brain size={18} /> Therapist Recommendation
                    </h4>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text)', fontWeight: 'bold' }}>{insights.therapistType}</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'color-mix(in oklab, var(--text), transparent 20%)', lineHeight: '1.6' }}>{insights.advice}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Quick Voice Entry Display */}
            {transcript && (
              <div style={{
                marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: '16px',
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)' }}>
                  <Mic size={16} /> Quick Voice Entry
                </h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'color-mix(in oklab, var(--text), transparent 20%)', fontStyle: 'italic' }}>
                  "{transcript}"
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleSaveVoiceEntry} style={{ padding: '0.5rem 1rem', background: 'var(--accent-600)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Save Entry</button>
                  <button onClick={clearTranscript} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Discard</button>
                </div>
              </div>
            )}

            <MoodPicker onMoodSelect={onMoodSelect} />
          </>
        )}
        <div className="history-date">
          <h2 className="history-today-title">Today</h2>
          <div className="history-datetime-group">
            <span className="history-date-part">{dateString}</span>
            <span className="history-time-part">{timeString}</span>
          </div>
        </div>
      </div>
  {renderOnlyHeader ? null : (
      <HistoryList 
        entries={pastEntries} 
        loading={loading} 
        error={error} 
        onDelete={onDelete}
        onEdit={onEdit}
      />
  )}
    </>
  );
};

export default HistoryView;