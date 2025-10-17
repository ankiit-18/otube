const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function generateSummary(transcript, language = 'en') {
  if (!transcript.trim()) return 'Transcript not available to summarize.';
  
  const res = await fetch(`${API_BASE}/api/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: transcript, language }),
  });
  
  if (!res.ok) {
    throw new Error(`Summary generation failed: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.summary || 'No summary generated.';
}

export async function extractKeyPoints(transcript, language = 'en') {
  if (!transcript.trim()) return [];
  
  const res = await fetch(`${API_BASE}/api/keypoints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: transcript, language }),
  });
  
  if (!res.ok) {
    throw new Error(`Key points extraction failed: ${res.statusText}`);
  }
  
  const data = await res.json();
  const kp = data.keyPoints || [];
  if (Array.isArray(kp) && kp.length > 0 && typeof kp[0] === 'string') {
    return kp.map((t, i) => ({ id: String(i + 1), text: t }));
  }
  return kp;
}

export async function generateQuestions(transcript, language = 'en') {
  if (!transcript.trim()) return [];
  
  const res = await fetch(`${API_BASE}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: transcript, language }),
  });
  
  if (!res.ok) {
    throw new Error(`Question generation failed: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.questions || [];
}

export async function answerQuestion(question, context, chatHistory, language = 'en') {
  const res = await fetch(`${API_BASE}/api/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, video: context, history: chatHistory.slice(-6), language }),
  });
  
  if (!res.ok) {
    throw new Error(`Answer generation failed: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.answer || 'No response.';
}

export async function processYouTubeVideo(url, language = 'en') {
  try {
    const response = await fetch(`${API_BASE}/api/process-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process video');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to process video');
    }

    const video = {
      id: Date.now().toString(),
      youtubeUrl: url,
      videoId: data.videoId,
      title: data.videoInfo.title,
      thumbnailUrl: data.videoInfo.thumbnailUrl,
      transcript: data.transcript,
      summary: data.summary,
      keyPoints: Array.isArray(data.keyPoints) && typeof data.keyPoints[0] === 'string'
        ? data.keyPoints.map((t, i) => ({ id: String(i + 1), text: t }))
        : data.keyPoints,
    };
    return video;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}

export async function generateTeaching(summary, language = 'en') {
  const summaryText = typeof summary === 'string' ? summary : JSON.stringify(summary);
  if (!summaryText.trim()) return '';
  
  const res = await fetch(`${API_BASE}/api/teach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: summaryText, language }),
  });
  
  if (!res.ok) {
    throw new Error(`Teaching generation failed: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.teaching || '';
}
