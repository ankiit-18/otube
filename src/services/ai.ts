import { Video, Message, Question } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Real AI responses using FastAPI backend
export async function generateSummary(transcript: string, language: string = 'en'): Promise<string> {
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

export async function extractKeyPoints(transcript: string, language: string = 'en'): Promise<string[]> {
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
  return data.keyPoints || [];
}

export async function generateQuestions(transcript: string, language: string = 'en'): Promise<Question[]> {
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

export async function answerQuestion(question: string, context: Video, chatHistory: Message[], language: string = 'en'): Promise<string> {
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

export async function processYouTubeVideo(url: string, language: string = 'en'): Promise<Video> {
  try {
    // Use the process-video endpoint
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

    // Use summary and key points from the process-video response
    return {
      id: Date.now().toString(),
      youtubeUrl: url,
      videoId: data.videoId,
      title: data.videoInfo.title,
      thumbnailUrl: data.videoInfo.thumbnailUrl,
      transcript: data.transcript,
      summary: data.summary,
      keyPoints: data.keyPoints,
    };
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}

export async function generateTeaching(summary: string, language: string = 'en'): Promise<string> {
  if (!summary.trim()) return '';
  
  const res = await fetch(`${API_BASE}/api/teach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: summary, language }),
  });
  
  if (!res.ok) {
    throw new Error(`Teaching generation failed: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.teaching || '';
}
