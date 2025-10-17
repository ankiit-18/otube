import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { formatBoldText } from '../utils/textFormatting';

export function QuestionList({ questions, onGenerateMore, generatingMore }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!questions || questions.length === 0) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
          <div className="flex items-center gap-2 text-white">
            <HelpCircle className="w-5 h-5" />
            <h3 className="font-semibold">Practice Questions</h3>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
                className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="text-gray-800 font-medium">{formatBoldText(question.question)}</div>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(
                      question.difficulty
                    )}`}
                  >
                    {String(question.difficulty).toUpperCase()}
                  </span>
                </div>
                {expandedId === question.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                )}
              </button>
              {expandedId === question.id && (
                <div className="px-4 py-4 bg-green-50 border-t border-green-100">
                  <p className="text-sm font-semibold text-green-800 mb-2">Answer:</p>
                  <div className="text-gray-700 leading-relaxed">{formatBoldText(question.answer)}</div>
                </div>
              )}
            </div>
          ))}
          
          {onGenerateMore && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onGenerateMore}
                disabled={generatingMore}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {generatingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating More Questions...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generate More Questions
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
