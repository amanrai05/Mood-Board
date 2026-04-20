export const getAIInsights = (moodValue, textContent) => {
  const text = textContent.toLowerCase();
  
  // Base recommendations based on mood (1 = Terrible, 5 = Amazing)
  let recommendations = {
    therapistType: '',
    advice: '',
    songs: [],
    playlistUrl: ''
  };

  // Keyword analysis for more specific advice
  const hasAnxiety = text.includes('anxious') || text.includes('panic') || text.includes('stress') || text.includes('worry') || text.includes('overwhelmed');
  const hasDepression = text.includes('sad') || text.includes('hopeless') || text.includes('tired') || text.includes('give up') || text.includes('lonely') || text.includes('cry');
  const hasAnger = text.includes('angry') || text.includes('mad') || text.includes('hate') || text.includes('frustrated') || text.includes('annoyed');
  const hasBurnout = text.includes('exhausted') || text.includes('burnout') || text.includes('work') || text.includes('school') || text.includes('boss');
  
  // Logic for Bad/Terrible Moods (1 & 2)
  if (moodValue <= 2) {
    if (hasAnxiety) {
      recommendations.therapistType = "Cognitive Behavioral Therapist (CBT)";
      recommendations.advice = "It sounds like you're dealing with high stress or anxiety. A CBT therapist can help you identify and challenge anxious thought patterns. For now, try the '5-4-3-2-1' grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.";
      recommendations.songs = [
        { title: "Weightless", artist: "Marconi Union", reason: "Scientifically proven to reduce anxiety." },
        { title: "Breathe Me", artist: "Sia", reason: "For when you need to feel your emotions." }
      ];
      recommendations.playlistUrl = "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator";
    } else if (hasAnger) {
      recommendations.therapistType = "Dialectical Behavior Therapist (DBT)";
      recommendations.advice = "Anger is a valid emotion, but holding onto it can be draining. DBT focuses on emotional regulation. Try stepping away from the situation, doing some intense exercise for 5 minutes, or splashing cold water on your face to reset your nervous system.";
      recommendations.songs = [
        { title: "Break Stuff", artist: "Limp Bizkit", reason: "Sometimes you just need to let the rage out." },
        { title: "Given Up", artist: "Linkin Park", reason: "A perfect outlet for frustration." }
      ];
      recommendations.playlistUrl = "https://open.spotify.com/embed/playlist/37i9dQZF1DX3YSRoSdA634?utm_source=generator";
    } else if (hasBurnout) {
      recommendations.therapistType = "Occupational Therapist or Career Counselor";
      recommendations.advice = "You're showing signs of burnout. It's crucial to set boundaries. Unplug from your devices 1 hour before bed, and remember that your worth is not tied to your productivity.";
      recommendations.songs = [
        { title: "Vienna", artist: "Billy Joel", reason: "A reminder to slow down." },
        { title: "Under Pressure", artist: "Queen", reason: "You are not alone in feeling the weight of the world." }
      ];
      recommendations.playlistUrl = "https://open.spotify.com/embed/playlist/37i9dQZF1DX2yvmlOd1gXC?utm_source=generator"; // Chill vibes
    } else {
      recommendations.therapistType = "Psychodynamic or Person-Centered Therapist";
      recommendations.advice = "I'm sorry you're having a tough time. It's okay to not be okay. Remember to be gentle with yourself today. Drink a glass of water, eat something nourishing, and take it one hour at a time.";
      recommendations.songs = [
        { title: "Fix You", artist: "Coldplay", reason: "A comforting classic." },
        { title: "Let It Be", artist: "The Beatles", reason: "For peace of mind." }
      ];
      recommendations.playlistUrl = "https://open.spotify.com/embed/playlist/37i9dQZF1DWVV27DiNWxkR?utm_source=generator"; // Sad indie
    }
  } 
  // Logic for Neutral Mood (3)
  else if (moodValue === 3) {
    recommendations.therapistType = "Life Coach or General Counselor";
    recommendations.advice = "Things are okay, but maybe feeling a bit stagnant? It's a great time to practice gratitude. Write down 3 small things that made you smile today.";
    recommendations.songs = [
        { title: "Put Your Records On", artist: "Corinne Bailey Rae", reason: "Perfect for a chill afternoon." },
        { title: "Sunday Morning", artist: "Maroon 5", reason: "Easy listening." }
    ];
    recommendations.playlistUrl = "https://open.spotify.com/embed/playlist/37i9dQZF1DWTvNyxOwkztu?utm_source=generator";
  }
  // Logic for Good/Amazing Moods (4 & 5)
  else {
    recommendations.therapistType = "You're doing great! No immediate therapy needed.";
    recommendations.advice = "You're radiating positive energy! Capture this feeling. What made today so good? Write it down so you can look back on this when you have a hard day. Keep riding this wave!";
    recommendations.songs = [
        { title: "Don't Stop Me Now", artist: "Queen", reason: "Pure unadulterated hype." },
        { title: "Good Days", artist: "SZA", reason: "A beautiful, uplifting vibe." },
        { title: "Walking On Sunshine", artist: "Katrina & The Waves", reason: "The ultimate happy song." }
    ];
    recommendations.playlistUrl = "https://open.spotify.com/embed/playlist/37i9dQZF1DXdPec7aLTmlC?utm_source=generator"; // Happy hits
  }

  return recommendations;
};
