import { X, GitBranch, CircleDot } from 'lucide-react';

// Simple mind-map style side panel using summary JSON and key points
export function MindMap({ video, onClose }) {
  const summary = typeof video.summary === 'string' ? null : (video.summary || {});
  const rootTitle = summary?.title || video.title || 'Mind Map';

  const nodes = [];
  if (summary?.paragraphs?.length) {
    nodes.push({ label: 'Overview', children: summary.paragraphs.map((p, i) => ({ label: p })) });
  }
  if (summary?.bullets?.length) {
    nodes.push({ label: 'Highlights', children: summary.bullets.map((b, i) => ({ label: b })) });
  }
  if (Array.isArray(summary?.sections)) {
    summary.sections.forEach((sec) => {
      const children = [];
      if (sec.paragraphs) children.push(...sec.paragraphs.map((p) => ({ label: p })));
      if (sec.bullets) children.push(...sec.bullets.map((b) => ({ label: b })));
      nodes.push({ label: sec.heading || 'Section', children });
    });
  }
  if (Array.isArray(video.keyPoints) && video.keyPoints.length) {
    nodes.push({ label: 'Key Points', children: video.keyPoints.map((kp) => ({ label: kp.text })) });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* panel */}
      <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-gray-200 p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">{rootTitle}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          {nodes.map((n, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CircleDot className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">{n.label}</h4>
              </div>
              {Array.isArray(n.children) && n.children.length > 0 && (
                <ul className="ml-5 border-l border-gray-200 pl-4 space-y-2">
                  {n.children.map((c, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-4 top-2 w-4 h-px bg-gray-200" />
                      <span className="text-gray-700 leading-relaxed">{c.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {nodes.length === 0 && (
            <p className="text-gray-500">Mind map will appear once the summary or key points are available.</p>
          )}
        </div>
      </div>
    </div>
  );
}


