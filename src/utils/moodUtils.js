import { Frown, Meh, Smile, Heart } from 'lucide-react';

// Resolve a CSS variable to its computed value (fallback to provided value)
const cssVar = (name, fallback) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
};

export const MOODS = [
  { icon: Frown, value: 1, color: 'var(--mood-1)', label: 'Terrible' },
  { icon: Frown, value: 2, color: 'var(--mood-2)', label: 'Bad' },
  { icon: Meh,   value: 3, color: 'var(--mood-3)', label: 'Okay' },
  { icon: Smile, value: 4, color: 'var(--mood-4)', label: 'Good' },
  { icon: Heart, value: 5, color: 'var(--mood-5)', label: 'Amazing' },
];

export const getMoodIcon = (moodValue) => {
  const mood = MOODS.find(m => m.value === moodValue);
  if (!mood) return { icon: Meh, color: cssVar('--mood-3', '#f1fa8c') };
  // Resolve CSS var to concrete color for places that need an actual color value
  const resolved = mood.color.startsWith('var(')
    ? cssVar(mood.color.slice(4, -1), '#999')
    : mood.color;
  return { icon: mood.icon, color: resolved };
};

export const getMoodLabel = (moodValue) => {
  const mood = MOODS.find(m => m.value === moodValue);
  return mood ? mood.label : 'Unknown';
};

export const formatEntryTime = (entry) => {
  if (entry.created_at) {
    const date = new Date(entry.created_at);
    const time = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${entry.date} at ${time}`;
  }
  return entry.date;
};

export const getWeeklyMoodData = (pastEntries, days = 7) => {
  const today = new Date();
  const weekData = [];

  // Create entry lookup by date
  const entryLookup = {};
  pastEntries.forEach(entry => {
    entryLookup[entry.date] = entry;
  });

  // Get last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString();
    const entry = entryLookup[dateStr];

    weekData.push({
      date: days <= 7
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: entry ? entry.mood : null,
      moodEmoji: entry ? getMoodIcon(entry.mood).icon : null,
      hasEntry: !!entry,
    });
  }

  return weekData;
};

export const movingAverage = (arr, windowSize = 7) => {
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = arr.slice(start, i + 1).filter((v) => v != null);
    res.push(slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null);
  }
  return res;
};

export const mapExpressionToMood = (expressions) => {
  // Sort expressions by probability
  const sorted = Object.entries(expressions)
    .sort(([, a], [, b]) => b - a)
    .filter(([, prob]) => prob > 0.15); // Only consider emotions with > 15% confidence

  if (sorted.length === 0) {
    return { mood: 3, emoji: '😐', note: "Looks like a calm day. Hope you're doing well." };
  }

  const primary = sorted[0][0];
  const secondary = sorted.length > 1 ? sorted[1][0] : null;

  // Nuanced Emotion Blends
  if (primary === 'happy' && secondary === 'surprised') return { mood: 5, emoji: '🤩', note: "You look amazed and excited! What a great vibe." };
  if (primary === 'surprised' && secondary === 'happy') return { mood: 5, emoji: '🤩', note: "You look amazed and excited! What a great vibe." };
  
  if (primary === 'angry' && secondary === 'sad') return { mood: 1, emoji: '😫', note: "You seem really frustrated. It's okay to let it out." };
  if (primary === 'sad' && secondary === 'angry') return { mood: 1, emoji: '😫', note: "You seem really frustrated. It's okay to let it out." };

  if (primary === 'fearful' && secondary === 'surprised') return { mood: 2, emoji: '😱', note: "You look shocked or startled! Take a deep breath." };
  if (primary === 'surprised' && secondary === 'fearful') return { mood: 2, emoji: '😱', note: "You look shocked or startled! Take a deep breath." };

  if (primary === 'neutral' && secondary === 'sad') return { mood: 2, emoji: '😔', note: "You look a bit drained or bored. Make sure to rest." };
  if (primary === 'sad' && secondary === 'neutral') return { mood: 2, emoji: '😔', note: "You look a bit drained or bored. Make sure to rest." };

  if (primary === 'disgusted' && secondary === 'angry') return { mood: 1, emoji: '😤', note: "You look bitter or resentful. Don't let it consume you." };
  if (primary === 'angry' && secondary === 'disgusted') return { mood: 1, emoji: '😤', note: "You look bitter or resentful. Don't let it consume you." };

  // Fallbacks to basic primary emotion
  switch (primary) {
    case 'happy':
      return { mood: 5, emoji: '😊', note: "You look happy! Keep that positive energy going!" };
    case 'surprised':
      return { mood: 4, emoji: '😲', note: "Whoa, what a surprise! Hope it's a good one." };
    case 'neutral':
      return { mood: 3, emoji: '😐', note: "Looks like a calm day. Hope you're doing well." };
    case 'sad':
      return { mood: 2, emoji: '😢', note: "You seem a bit down. Take it easy and be kind to yourself." };
    case 'fearful':
      return { mood: 2, emoji: '😨', note: "You seem anxious or worried. Remember you're in a safe space." };
    case 'angry':
      return { mood: 1, emoji: '😠', note: "You look upset. Give yourself some grace." };
    case 'disgusted':
      return { mood: 1, emoji: '🤢', note: "Something's not right. Hope things get better!" };
    default:
      return { mood: 3, emoji: '😐', note: "Looks like a calm day. Hope you're doing well." };
  }
};