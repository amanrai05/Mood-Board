import { useState, useRef, useEffect } from 'react';
import MoodPicker from '../components/mood/MoodPicker';
import MoodDisplay from '../components/mood/MoodDisplay';
import GroupSelector from '../components/groups/GroupSelector';
import GroupManager from '../components/groups/GroupManager';
import MDArea from '../components/MarkdownArea.jsx';
import apiService from '../services/api';
import { useToast } from '../components/ui/ToastProvider';
import { Camera, Mic, Square, Sparkles, Brain, Music } from 'lucide-react';
import MoodDetector from '../components/mood/MoodDetector';
import { getAIInsights } from '../utils/aiInsights';
import { useSpeechToText } from '../utils/useSpeechToText';

const DEFAULT_MARKDOWN = `# How was your day?

Write about your thoughts, feelings, and experiences...`;

const EntryView = ({ 
  selectedMood, 
  groups, 
  onBack, 
  onCreateGroup, 
  onCreateOption, 
  onEntrySubmitted,
  onSelectMood,
  editingEntry = null,
  onEntryUpdated,
  onEditMoodSelect,
  aiResult,
}) => {
  const isEditing = Boolean(editingEntry);
  const [selectedOptions, setSelectedOptions] = useState(
    editingEntry?.selections?.map((selection) => selection.id) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showMoodDetector, setShowMoodDetector] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // 'therapist' | 'spotify' | null
  const [insights, setInsights] = useState(null);
  
  const markdownRef = useRef();
  const { show } = useToast();
  const { isRecording, transcript, toggleRecording, clearTranscript, supported: speechSupported } = useSpeechToText();

  // Append speech transcript to markdown editor when it updates
  useEffect(() => {
    if (transcript) {
      const currentMarkdown = markdownRef.current?.getMarkdown() || '';
      let newMarkdown = currentMarkdown.trim() === DEFAULT_MARKDOWN.trim() ? '' : currentMarkdown;
      // append the transcript
      markdownRef.current?.getInstance()?.setMarkdown(newMarkdown + (newMarkdown ? ' ' : '') + transcript);
      clearTranscript(); // clear so we don't append it again
    }
  }, [transcript, clearTranscript]);

  useEffect(() => {
    if (!isEditing || !editingEntry) return;

    setSelectedOptions(editingEntry.selections?.map((selection) => selection.id) ?? []);

    const instance = markdownRef.current?.getInstance?.();
    if (instance && typeof instance.setMarkdown === 'function') {
      instance.setMarkdown(editingEntry.content || '');
    }
  }, [isEditing, editingEntry]);

  useEffect(() => {
    if (isEditing) {
      setSubmitMessage('');
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setShowMoodPicker(false);
    }
  }, [isEditing]);

  const handleOptionToggle = (optionId) => {
    setSelectedOptions(prev => (prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]));
  };

  const handleMoodSelection = (moodValue) => {
    if (isEditing) {
      if (typeof onEditMoodSelect === 'function') {
        onEditMoodSelect(moodValue);
      }
      setShowMoodPicker(false);
    } else if (typeof onSelectMood === 'function') {
      onSelectMood(moodValue);
    }
  };

  const handleAIDetect = (result) => {
    handleMoodSelection(result.mood);
    
    setTimeout(() => {
      const currentMarkdown = markdownRef.current?.getMarkdown() || '';
      const newMarkdown = currentMarkdown.trim() === DEFAULT_MARKDOWN.trim() || currentMarkdown.trim() === ''
        ? `${result.emoji} ${result.note}\n\n`
        : `${currentMarkdown}\n\n${result.emoji} ${result.note}`;
        
      markdownRef.current?.getInstance()?.setMarkdown(newMarkdown);
    }, 100);

    setShowMoodDetector(false);
    show(`Detected expression! ${result.emoji}`, 'success');
  };

  const autoFillAppliedRef = useRef(false);

  // Auto-fill note if AI detection happened on the dashboard
  useEffect(() => {
    if (aiResult && !isEditing && !autoFillAppliedRef.current) {
      autoFillAppliedRef.current = true;
      setTimeout(() => {
        const currentMarkdown = markdownRef.current?.getMarkdown() || '';
        const newMarkdown = currentMarkdown.trim() === DEFAULT_MARKDOWN.trim() || currentMarkdown.trim() === ''
          ? `${aiResult.emoji} ${aiResult.note}\n\n`
          : `${currentMarkdown}\n\n${aiResult.emoji} ${aiResult.note}`;
          
        markdownRef.current?.getInstance()?.setMarkdown(newMarkdown);
      }, 100);
    }
  }, [aiResult, isEditing]);

  const handleGenerateInsights = (tabName) => {
    const content = markdownRef.current?.getMarkdown() || '';
    if (!selectedMood) {
      show('Please select a mood first to get personalized insights.', 'error');
      return;
    }
    const result = getAIInsights(selectedMood, content);
    setInsights(result);
    setActiveTab(activeTab === tabName ? null : tabName);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      if (!selectedMood) {
        show('Pick a mood before saving your entry.', 'error');
        setIsSubmitting(false);
        return;
      }

      const markdownContent = markdownRef.current?.getMarkdown() || '';
      if (!markdownContent.trim()) {
        show('Write a few thoughts before saving.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (isEditing && editingEntry) {
        const response = await apiService.updateMoodEntry(editingEntry.id, {
          mood: selectedMood,
          content: markdownContent,
          selected_options: selectedOptions,
        });

        if (response?.entry && typeof onEntryUpdated === 'function') {
          onEntryUpdated({
            ...editingEntry,
            ...response.entry,
            selections: response.entry.selections ?? [],
          });
        }

        if (typeof onBack === 'function') {
          onBack();
        }

        show('Entry updated successfully!', 'success');
        return;
      }

      const now = new Date();
      const response = await apiService.createMoodEntry({
        mood: selectedMood,
        date: now.toLocaleDateString(),
        time: now.toISOString(),
        content: markdownContent,
        selected_options: selectedOptions,
      });

      if (response.new_achievements && response.new_achievements.length > 0) {
        const achievementNames = {
          'first_entry': 'First Entry',
          'week_warrior': 'Week Warrior',
          'consistency_king': 'Consistency King',
          'data_lover': 'Data Lover',
          'mood_master': 'Mood Master'
        };
        const readableNames = response.new_achievements.map(type => achievementNames[type] || type).join(', ');
        setSubmitMessage(`Entry saved! 🎉 New achievement unlocked: ${readableNames}`);
      } else {
        setSubmitMessage('Entry saved successfully! 🎉');
      }

      markdownRef.current?.getInstance()?.setMarkdown(DEFAULT_MARKDOWN);
      setSelectedOptions([]);
      
      setTimeout(() => {
        onEntrySubmitted();
      }, 1500);
    } catch (error) {
      console.error('Failed to save entry:', error);
      if (isEditing) {
        show('Failed to update entry. Please try again.', 'error');
      } else {
        setSubmitMessage('Failed to save entry. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedMood && !isEditing) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={onBack}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent-bg)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {isEditing ? '← Cancel Edit' : '← Back'}
          </button>
        </div>
        
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>
              {isEditing ? 'Pick a new mood for this entry' : 'Pick your mood to start an entry'}
            </h3>
          </div>
          <MoodPicker onMoodSelect={handleMoodSelection} />
        </>
      </div>
    );
  }

  return (
    <div className="entry-container" style={{ marginTop: '1rem', position: 'relative' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--accent-bg)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {isEditing ? '← Cancel Edit' : '← Back to History'}
        </button>
      </div>

      <div className="entry-grid">
        <div className="entry-left">
          {isEditing && editingEntry && (
            <div style={{
              marginBottom: '0.75rem',
              fontSize: '0.85rem',
              color: 'color-mix(in oklab, var(--text), transparent 40%)'
            }}>
              Editing entry from <strong style={{ color: 'var(--text)' }}>{editingEntry.date}</strong>
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <MoodDisplay moodValue={selectedMood} />
            {isEditing && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowMoodDetector(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem',
                    background: 'transparent', color: 'var(--accent-600)', border: '1px solid var(--accent-600)',
                    borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                  }}
                >
                  <Camera size={14} /> Auto-Detect
                </button>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem',
                      background: isRecording ? '#ff4b4b' : 'transparent', 
                      color: isRecording ? 'white' : 'var(--text)', 
                      border: isRecording ? 'none' : '1px solid var(--border)',
                      borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                      animation: isRecording ? 'pulse 2s infinite' : 'none'
                    }}
                  >
                    {isRecording ? <Square size={14} /> : <Mic size={14} />}
                    {isRecording ? 'Stop Voice' : 'Voice Entry'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleGenerateInsights('therapist')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem',
                    background: activeTab === 'therapist' ? 'var(--accent-600)' : 'transparent',
                    color: activeTab === 'therapist' ? 'white' : 'var(--mood-4)',
                    border: activeTab === 'therapist' ? 'none' : '1px solid var(--mood-4)',
                    borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                  }}
                >
                  <Brain size={14} /> AI Therapist
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateInsights('spotify')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem',
                    background: activeTab === 'spotify' ? '#1DB954' : 'transparent',
                    color: activeTab === 'spotify' ? 'white' : '#1DB954',
                    border: activeTab === 'spotify' ? 'none' : '1px solid #1DB954',
                    borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                  }}
                >
                  <Music size={14} /> Spotify Match
                </button>

                <button
                  type="button"
                  onClick={() => setShowMoodPicker(true)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '999px', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 500,
                  }}
                >
                  Change Mood
                </button>
              </div>
            )}
          </div>
          {showMoodDetector && (
            <MoodDetector 
              onDetect={handleAIDetect} 
              onCancel={() => setShowMoodDetector(false)} 
            />
          )}

          {/* AI Insights Panels */}
          {activeTab === 'therapist' && insights && (
            <div style={{
              marginBottom: '1rem',
              padding: '1.25rem',
              background: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), transparent)',
              border: '1px solid var(--accent-600)',
              borderRadius: '16px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.5rem 0', color: 'var(--accent-600)' }}>
                <Brain size={16} /> Recommended Therapist
              </h5>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', fontWeight: 'bold' }}>
                {insights.therapistType}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'color-mix(in oklab, var(--text), transparent 10%)', lineHeight: '1.5' }}>
                {insights.advice}
              </p>
            </div>
          )}

          {activeTab === 'spotify' && insights && (
            <div style={{
              marginBottom: '1rem',
              padding: '1.25rem',
              background: 'linear-gradient(to bottom right, rgba(29, 185, 84, 0.1), transparent)',
              border: '1px solid #1DB954',
              borderRadius: '16px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.5rem 0', color: '#1DB954' }}>
                <Music size={16} /> Recommended Songs
              </h5>
              <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                {insights.songs.map((song, i) => (
                  <li key={i} style={{ marginBottom: '0.4rem' }}>
                    <strong>{song.title}</strong> by {song.artist}
                  </li>
                ))}
              </ul>
              {insights.playlistUrl && (
                <iframe 
                  style={{ borderRadius: '12px', border: 'none' }} 
                  src={insights.playlistUrl} 
                  width="100%" 
                  height="80" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  title="Spotify Playlist"
                ></iframe>
              )}
            </div>
          )}

          {isEditing && showMoodPicker && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <p style={{ marginTop: 0, marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                Pick a new mood
              </p>
              <MoodPicker onMoodSelect={handleMoodSelection} />
              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setShowMoodPicker(false)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'color-mix(in oklab, var(--text), transparent 30%)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <GroupSelector
            groups={groups}
            selectedOptions={selectedOptions}
            onOptionToggle={handleOptionToggle}
          />
          <div style={{ marginTop: '1rem' }}>
            <GroupManager
              groups={groups}
              onCreateGroup={onCreateGroup}
              onCreateOption={onCreateOption}
            />
          </div>
        </div>

        <div className="entry-right">
          <MDArea ref={markdownRef} />

          <div className="entry-savebar" style={{ marginTop: '1.5rem' }}>
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              style={{
                padding: '0.9rem 2rem',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, var(--accent-bg), var(--accent-bg-2))',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: !isSubmitting ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>

      {submitMessage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-3)',
              border: '1px solid var(--border)',
              textAlign: 'center',
              minWidth: '300px',
              maxWidth: 'min(560px, 90%)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <div style={{
              color: submitMessage.includes('achievement') ? 'var(--accent-600)' : 'var(--text)',
              fontWeight: '600',
              fontSize: '1.1rem',
              lineHeight: '1.4'
            }}>
              {submitMessage}
            </div>
          </div>
        </div>
      )}

      {submitMessage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--overlay)',
            zIndex: 5
          }}
        />
      )}
    </div>
  );
};

export default EntryView;