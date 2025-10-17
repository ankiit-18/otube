import { useState } from 'react';
import { VideoInput } from './components/VideoInput';
import { VideoSummary } from './components/VideoSummary';
import { ChatInterface } from './components/ChatInterface';
import { QuestionList } from './components/QuestionList';
import { MindMap } from './components/MindMap';
import { LanguageSelector } from './components/LanguageSelector';
import { processYouTubeVideo, generateQuestions, answerQuestion, generateSummary, extractKeyPoints } from './services/ai';
import { GraduationCap, Sparkles } from 'lucide-react';

function App() {
  const [video, setVideo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingMoreQuestions, setGeneratingMoreQuestions] = useState(false);
  const [needsTranscript, setNeedsTranscript] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showMindMap, setShowMindMap] = useState(false);

  const handleVideoSubmit = async (url) => {
    try {
      setLoading(true);
      setVideo(null);
      setMessages([]);
      setQuestions([]);

      const processedVideo = await processYouTubeVideo(url, selectedLanguage);
      setVideo(processedVideo);

      const generatedQuestions = await generateQuestions(processedVideo.transcript, selectedLanguage);
      setQuestions(generatedQuestions);

      setNeedsTranscript(!processedVideo.transcript);
    } catch (error) {
      console.error('Error processing video:', error);
      alert('Failed to process video. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTranscript = async () => {
    if (!video) return;
    const pasted = window.prompt('Paste the transcript for this video:');
    if (!pasted) return;
    try {
      setLoading(true);
      const summary = await generateSummary(pasted, selectedLanguage);
      const keyPoints = await extractKeyPoints(pasted, selectedLanguage);
      const updated = { ...video, transcript: pasted, summary, keyPoints };
      setVideo(updated);
      const generatedQuestions = await generateQuestions(pasted, selectedLanguage);
      setQuestions(generatedQuestions);
      setNeedsTranscript(false);
    } catch (e) {
      console.error('Manual transcript processing failed', e);
      alert('Failed to process the pasted transcript.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!video) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);

    try {
      const response = await answerQuestion(content, video, messages, selectedLanguage);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateMoreQuestions = async () => {
    if (!video?.transcript) return;

    try {
      setGeneratingMoreQuestions(true);
      const newQuestions = await generateQuestions(video.transcript, selectedLanguage);
      
      const questionsWithNewIds = newQuestions.map((q, index) => ({
        ...q,
        id: `${Date.now()}-${index}`
      }));
      
      setQuestions((prev) => [...prev, ...questionsWithNewIds]);
    } catch (error) {
      console.error('Error generating more questions:', error);
      alert('Failed to generate more questions. Please try again.');
    } finally {
      setGeneratingMoreQuestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              OTUBE
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform any YouTube video into an interactive learning experience with AI-powered summaries,
            insights, and personalized Q&A
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Advanced AI Technology</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector 
                selectedLanguage={selectedLanguage} 
                onLanguageChange={setSelectedLanguage} 
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMindMap(true)}
                disabled={!video}
                className="px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mind Map
              </button>
            </div>
          </div>
        </header>

        <VideoInput onSubmit={handleVideoSubmit} loading={loading} />

        {video && (
          <div className="space-y-8 animate-fade-in">
            {needsTranscript && (
              <div className="max-w-5xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                Transcript could not be fetched. You can paste it manually.
                <button
                  onClick={handleManualTranscript}
                  className="ml-3 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700"
                >
                  Paste transcript manually
                </button>
              </div>
            )}
            <VideoSummary video={video} language={selectedLanguage} />

            <div className="grid lg:grid-cols-2 gap-8">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={chatLoading}
              />

              <QuestionList 
                questions={questions} 
                onGenerateMore={handleGenerateMoreQuestions}
                generatingMore={generatingMoreQuestions}
              />
            </div>
          </div>
        )}

        {showMindMap && video && (
          <MindMap video={video} onClose={() => setShowMindMap(false)} />
        )}

        {!video && !loading && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Paste YouTube URL</h3>
                  <p className="text-sm text-gray-600">
                    Enter any YouTube video link you want to learn from
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Get AI Summary</h3>
                  <p className="text-sm text-gray-600">
                    Receive instant summaries and key learning points
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-amber-600">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Interactive Learning</h3>
                  <p className="text-sm text-gray-600">
                    Ask questions and practice with generated quizzes
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
