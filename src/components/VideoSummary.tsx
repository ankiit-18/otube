import { useState } from 'react';
import { Video } from '../types';
import { BookOpen, Lightbulb, Video as VideoIcon } from 'lucide-react';
import { generateTeaching } from '../services/ai';
import { formatText, formatBoldText } from '../utils/textFormatting';

interface VideoSummaryProps {
  video: Video;
  language: string;
}

export function VideoSummary({ video, language }: VideoSummaryProps) {
  const [teaching, setTeaching] = useState<string>('');
  const [teachLoading, setTeachLoading] = useState(false);

  const handleTeach = async () => {
    try {
      setTeachLoading(true);
      const resp = await generateTeaching(video.summary, language);
      setTeaching(resp);
    } catch (e) {
      setTeaching('Failed to generate detailed explanation.');
    } finally {
      setTeachLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* ===== Video Header Section ===== */}
        <div className="relative">
          {video.thumbnailUrl && (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{video.title}</h2>
            <div className="flex items-center gap-2 text-white/90">
              <VideoIcon className="w-4 h-4" />
              <span className="text-sm">YouTube Video Analysis</span>
            </div>
          </div>
        </div>

        {/* ===== Summary + Key Points Section ===== */}
        <div className="p-6 space-y-8">

          {/* === Summary Section === */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-semibold text-gray-900">Summary</h3>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-6 shadow-sm">
              <div className="prose prose-blue max-w-none leading-relaxed text-gray-800">
                {formatText(video.summary)}
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={handleTeach}
                disabled={teachLoading}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white text-sm font-medium disabled:opacity-50 shadow-md"
              >
                {teachLoading ? 'Generating explanation…' : 'Explain in detail'}
              </button>
            </div>

            {teaching && (
              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg shadow-inner">
                <h4 className="font-semibold text-blue-700 mb-2">Detailed Explanation</h4>
                <div className="prose prose-blue text-gray-800">
                  {formatText(teaching)}
                </div>
              </div>
            )}
          </section>

          {/* === Key Points Section === */}
          {video.keyPoints && video.keyPoints.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                <h3 className="text-2xl font-semibold text-gray-900">Key Learning Points</h3>
              </div>

              <ul className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                {video.keyPoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex gap-3 items-start bg-amber-50 p-4 rounded-xl border border-amber-100 hover:bg-amber-100 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 leading-relaxed">{formatBoldText(point)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
