export function extractVideoId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const vParam = u.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0] || '';
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    const parts = u.pathname.split('/').filter(Boolean);
    const maybeIdx = parts.findIndex(p => p === 'embed' || p === 'shorts');
    if (maybeIdx >= 0 && parts[maybeIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[maybeIdx + 1])) {
      return parts[maybeIdx + 1];
    }

    const tokenMatch = url.match(/([a-zA-Z0-9_-]{11})(?![a-zA-Z0-9_-])/);
    if (tokenMatch) return tokenMatch[1];
  } catch {
    const patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /embed\/([a-zA-Z0-9_-]{11})/,
      /shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const m = url.match(pattern);
      if (m && m[1]) return m[1];
    }
  }
  return null;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function getThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export async function fetchVideoDetails(videoId) {
  return { title: `YouTube Video: ${videoId}` };
}

export async function fetchTranscript(videoId) {
  try {
    const res = await fetch(`${API_BASE}/api/transcript/${encodeURIComponent(videoId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      throw new Error(`Transcript fetch failed: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.transcript || '';
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return '';
  }
}
