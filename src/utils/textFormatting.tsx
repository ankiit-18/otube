import React from 'react';

// Handle bold text — now starts new line if bold is found
export const formatBoldText = (text: string): React.ReactNode => {
  if (!text) return '';

  // Split by **bold**
  const parts = text.split(/(\*\*.*?\*\*)/);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const bold = part.slice(2, -2);
      return (
        <div key={i} className="font-semibold text-gray-900 mt-2 mb-1">
          {bold}
        </div>
      );
    }
    return part;
  });
};

// Nicely format LLM text (summary, key points, etc.)
export const formatText = (text: string): React.ReactNode => {
  if (!text) return '';

  text = text.replace(/\r\n/g, '\n').trim();

  // Remove redundant first line in key points (e.g., "Here are the key points...")
  text = text.replace(/^Here are the key points[\s\S]*?:\s*/i, '');

  // Split by double newlines or line breaks
  const sections = text.split(/\n\s*\n/);

  return sections.map((section, i) => {
    const trimmed = section.trim();

    // Headings like "Key Points:", "Main Takeaways:", "Summary:"
    if (/^(Key Points|Main Takeaways|Summary|Highlights):?/i.test(trimmed)) {
      return (
        <h4
          key={i}
          className="text-lg font-semibold text-blue-700 mt-4 mb-2 border-b border-blue-100 pb-1"
        >
          {trimmed.replace(':', '')}
        </h4>
      );
    }

    // Numbered points (1., 2., etc.)
    if (/^\d+\./.test(trimmed)) {
      return (
        <div key={i} className="flex gap-2 items-start mb-2">
          <span className="text-blue-600 font-semibold">
            {trimmed.match(/^\d+\./)?.[0]}
          </span>
          <span className="text-gray-800 leading-relaxed">
            {formatBoldText(trimmed.replace(/^\d+\.\s*/, ''))}
          </span>
        </div>
      );
    }

    // Bullet points (*, -, •)
    if (/^(\*|-|•)\s/.test(trimmed)) {
      return (
        <div key={i} className="flex gap-2 items-start mb-2">
          <span className="text-blue-600 font-semibold">•</span>
          <span className="text-gray-800 leading-relaxed">
            {formatBoldText(trimmed.replace(/^(\*|-|•)\s/, ''))}
          </span>
        </div>
      );
    }

    // Regular paragraph
    return (
      <p key={i} className="text-gray-800 leading-relaxed mb-3">
        {formatBoldText(trimmed)}
      </p>
    );
  });
};
