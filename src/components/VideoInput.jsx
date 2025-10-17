import { useState } from 'react';
import { Youtube, Loader2 } from 'lucide-react';

export function VideoInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (url.trim()) {
      await onSubmit(url.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <div className="pl-3">
            <Youtube className="w-6 h-6 text-red-500" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL here to start learning..."
            className="flex-1 px-2 py-3 text-lg outline-none bg-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Analyze Video'
            )}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-500 text-sm mt-4">
        Enter any YouTube video URL to get AI-powered summaries, key points, and interactive learning.
      </p>
    </div>
  );
}
