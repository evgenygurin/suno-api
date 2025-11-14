import AIEnhancedMusicGenerator from '@/app/components/AIEnhancedMusicGenerator';

export default function AIDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎵 AI-Enhanced Music Generator
          </h1>
          <p className="text-gray-300">
            Powered by OpenAI GPT-4o + Suno AI
          </p>
        </div>
        <AIEnhancedMusicGenerator />
      </div>
    </div>
  );
}
