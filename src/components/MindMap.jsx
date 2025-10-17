import { X, GitBranch, CircleDot, Download } from 'lucide-react';
import { useMemo, useRef } from 'react';

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

  // Build node hierarchy
  const tree = useMemo(() => {
    return {
      label: rootTitle,
      children: nodes
    };
  }, [rootTitle, nodes]);

  // Basic layout constants
  const svgPadding = 24;
  const levelGapX = 220; // horizontal distance between levels
  const nodeGapY = 80;   // vertical gap between sibling nodes
  const nodeWidth = 180;
  const nodeHeight = 44;

  // Convert tree to positioned nodes (very simple top-down layout)
  function layoutTree(root) {
    // Flatten second level as vertical list; third level under each
    const level1 = root.children || [];
    const yOffsets = [];
    for (let i = 0; i < level1.length; i++) {
      yOffsets.push(i * nodeGapY);
    }
    const midY = ((level1.length - 1) * nodeGapY) / 2;
    const positioned = [];
    // Root at (x0, y0)
    const x0 = svgPadding + nodeWidth / 2;
    const y0 = svgPadding + Math.max(0, midY);
    positioned.push({ id: 'root', label: root.label, x: x0, y: y0, level: 0 });
    // Level 1
    level1.forEach((n, i) => {
      const x = x0 + levelGapX;
      const y = svgPadding + yOffsets[i];
      const id = `l1-${i}`;
      positioned.push({ id, label: n.label, x, y, level: 1, parent: 'root' });
      if (Array.isArray(n.children)) {
        n.children.forEach((c, j) => {
          const x2 = x + levelGapX;
          const y2 = y + (j - (n.children.length - 1) / 2) * (nodeGapY / 1.2);
          const cid = `${id}-c-${j}`;
          positioned.push({ id: cid, label: c.label, x: x2, y: y2, level: 2, parent: id });
        });
      }
    });
    return positioned;
  }

  const positionedNodes = useMemo(() => layoutTree(tree), [tree]);
  const edges = useMemo(() => {
    const map = new Map(positionedNodes.map(n => [n.id, n]));
    const e = [];
    positionedNodes.forEach(n => {
      if (n.parent) {
        e.push({ from: map.get(n.parent), to: n });
      }
    });
    return e;
  }, [positionedNodes]);

  // Compute SVG size
  const maxX = Math.max(...positionedNodes.map(n => n.x)) + nodeWidth + svgPadding;
  const minY = Math.min(...positionedNodes.map(n => n.y)) - nodeHeight;
  const maxY = Math.max(...positionedNodes.map(n => n.y)) + nodeHeight * 2;
  const svgWidth = Math.max(600, maxX + svgPadding);
  const svgHeight = Math.max(400, maxY - Math.min(0, minY) + svgPadding);

  const svgRef = useRef(null);

  const downloadPng = async () => {
    try {
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const serializer = new XMLSerializer();
      const src = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgWidth;
        canvas.height = svgHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'mindmap.png';
          a.click();
        }, 'image/png');
      };
      img.src = url;
    } catch (e) {
      console.error('Mind map export failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* panel */}
      <div className="w-full max-w-4xl h-full bg-white shadow-2xl border-l border-gray-200 p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">{rootTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPng} className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* SVG Diagram */}
        <div className="w-full overflow-auto mt-4">
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            xmlns="http://www.w3.org/2000/svg"
            className="bg-white border border-gray-200 rounded-lg"
          >
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
              </marker>
            </defs>

            {/* edges */}
            {edges.map((e, i) => (
              <line
                key={i}
                x1={e.from.x + nodeWidth / 2}
                y1={e.from.y + nodeHeight / 2}
                x2={e.to.x}
                y2={e.to.y + nodeHeight / 2}
                stroke="#94a3b8"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            ))}

            {/* nodes */}
            {positionedNodes.map((n) => (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                <rect x={-nodeWidth / 2} y={0} width={nodeWidth} height={nodeHeight} rx="10" ry="10" fill={n.level === 0 ? '#e0f2fe' : n.level === 1 ? '#eef2ff' : '#f1f5f9'} stroke="#cbd5e1" />
                <text x={0} y={nodeHeight / 2 + 4} textAnchor="middle" fontFamily="Inter, ui-sans-serif" fontSize="12" fill="#0f172a">
                  {n.label?.length > 60 ? n.label.slice(0, 57) + '…' : n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Textual Tree (fallback / accessibility) */}
        <div className="space-y-4 mt-6">
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


