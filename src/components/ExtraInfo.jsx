import { useEffect, useState } from 'react';
import { X, Info, Loader2 } from 'lucide-react';
import { generateTeaching } from '../services/ai';
import { formatText } from '../utils/textFormatting';

export function ExtraInfo({ video, language, onClose }) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const run = async () => {
    if (!video) return;
    try {
      setLoading(true);
      const base = typeof video.summary === 'string' ? video.summary : JSON.stringify(video.summary);
      const promptPrefix = 'Provide concise extra context/background, definitions, and related subtopics NOT explicitly covered in the transcript. Focus on missing foundations and broader perspective. ';
      const resp = await generateTeaching(`${promptPrefix}\n${base}`, language);
      setContent(resp);
    } catch (e) {
      setContent('Failed to generate extra information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl border-r border-gray-200 p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-600" />
            <h3 className="text-xl font-semibold text-gray-900">Extra Info (Beyond Transcript)</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</div>
        ) : (
          <div className="prose max-w-none">{formatText(content)}</div>
        )}
      </div>
      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  );
}


