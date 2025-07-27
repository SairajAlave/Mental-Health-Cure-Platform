import { Canvas } from '@react-three/fiber';
import { ThreeDExperience } from '@/components/ThreeDExperience';
import { useNavigate } from 'react-router-dom';
import { corresponding, LipsyncCue } from '@/components/ThreeDAvatar';
import { useState, useRef } from 'react';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';
import { Mic, MicOff, Send, ArrowLeft } from 'lucide-react';

// Simple viseme mapping for demo
const visemeMap = [
  'A', // open
  'B', // closed
  'C', // smile
  'D', // wide open
  'E', // round
  'F', // frown
  'G', // neutral
  'H', // tongue
  'X', // fallback
];

function textToVisemes(text: string): { mouthCues: LipsyncCue[] } {
  // For demo: map each letter to a viseme, evenly spaced
  const letters = text.replace(/[^a-zA-Z]/g, '').toUpperCase().split('');
  const duration = Math.max(1.5, text.split(' ').length * 0.5); // estimate duration in seconds
  const cueLength = duration / Math.max(letters.length, 1);
  const mouthCues = letters.map((char, i) => {
    const viseme = visemeMap[char.charCodeAt(0) % visemeMap.length];
    return {
      start: i * cueLength,
      end: (i + 1) * cueLength,
      value: typeof viseme === 'string' ? (viseme as keyof typeof corresponding) : 'X',
    };
  });
  return { mouthCues };
}

// Utility to clean text for TTS (remove emojis, asterisks, markdown)
function cleanForTTS(text: string): string {
  // Remove emojis
  const noEmojis = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
  // Remove asterisks and markdown-like formatting
  const noAsterisks = noEmojis.replace(/\*+/g, '');
  // Remove leading/trailing whitespace and extra spaces
  return noAsterisks.replace(/\s+/g, ' ').trim();
}

// Message history type
type MessageTurn = { role: 'user' | 'assistant', content: string };

const VirtualCompanion = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lipsync, setLipsync] = useState<{ mouthCues: LipsyncCue[] } | undefined>(undefined);
  const {
    speak,
    isSpeaking,
    stopSpeaking,
    isListening,
    startListening,
    stopListening,
  } = useVoiceInteraction({
    onTranscript: (transcript) => {
      // Append to existing input instead of replacing
      setInput(prev => {
        // Add line breaks after sentences for better formatting
        const formattedTranscript = transcript.replace(/([.!?])\s+/g, '$1\n\n');
        const newInput = prev ? `${prev} ${formattedTranscript}` : formattedTranscript;
        // Force textarea to re-render with newlines
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newInput;
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
          }
        }, 0);
        // Only auto-send if this is the first voice input (empty before)
        if (!prev) {
          setTimeout(() => {
            handleSend();
          }, 500);
        }
        return newInput;
      });
      // Force re-render
      setTextareaKey(prev => prev + 1);
    },
    onSpeakComplete: () => {
      setLipsync(undefined);
      setFakeAudio(null);
      if (fakeAudioInterval.current) clearInterval(fakeAudioInterval.current);
    },
    onSpeakStart: () => {
      // --- Start fake audio timer for TTS lipsync ---
      if (!lastTTSData.current) return;
      const data = lastTTSData.current;
      const estDuration = Math.max(1.5, data.trim().split(' ').length * 0.5);
      if (fakeAudioInterval.current) clearInterval(fakeAudioInterval.current);
      const fake = { currentTime: 0 };
      setFakeAudio(fake);
      const start = Date.now();
      fakeAudioInterval.current = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        fake.currentTime = elapsed;
        setFakeAudio({ ...fake }); // force update
        if (elapsed >= estDuration) {
          setFakeAudio(null);
          clearInterval(fakeAudioInterval.current!);
        }
      }, 50);
      // ---
    },
  });
  // Store the last TTS data for use in onSpeakStart
  const lastTTSData = useRef<string | null>(null);
  // --- FAKE AUDIO for TTS lipsync ---
  const [fakeAudio, setFakeAudio] = useState<{ currentTime: number } | null>(null);
  const fakeAudioInterval = useRef<NodeJS.Timeout | null>(null);
  // ---
  const ttsTimeout = useRef<NodeJS.Timeout | null>(null);
  const [lastAIMessage, setLastAIMessage] = useState<string>("");
  // Conversation history
  const [history, setHistory] = useState<MessageTurn[]>([]);
  // Force re-render key for textarea
  const [textareaKey, setTextareaKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const message = input.trim();
    if (!message) return;
    setIsLoading(true);
    setInput('');
    // Prepare history for backend (last 10 turns)
    const historyForBackend = [...history].slice(-10);
    try {
      const res = await fetch('http://127.0.0.1:5005/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: historyForBackend })
      });
      const data = await res.text();
      // Generate lipsync cues
      const cleaned = cleanForTTS(data.trim());
      const cues = textToVisemes(cleaned);
      setLipsync(cues);
      setLastAIMessage(data.trim());
      // Update conversation history
      setHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: data.trim() }
      ]);
      // Estimate speech duration and clear lipsync after
      const estDuration = Math.max(1.5, data.trim().split(' ').length * 0.5);
      if (ttsTimeout.current) clearTimeout(ttsTimeout.current);
      ttsTimeout.current = setTimeout(() => setLipsync(undefined), estDuration * 1000);
      // Save TTS data for onSpeakStart
      lastTTSData.current = cleaned;
      speak(cleaned);
    } catch (err) {
      // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex flex-col relative overflow-hidden">
      <div className="p-4 z-10">
        <button
          className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          onClick={() => navigate('/ai-companion')}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Chat</span>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-full relative">
          {/* Thinking animation overlay */}
          {isLoading && (
            <div className="absolute left-[49.11%] top-[10%] transform -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
              <div className="bg-white/90 border border-purple-200 rounded-2xl shadow-lg px-6 py-3 flex flex-col items-center">
                <div className="flex space-x-1 mb-1">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-purple-500 text-sm font-medium">Thinking...</span>
              </div>
            </div>
          )}
          <Canvas camera={{ position: [0, 3.9, 1.7] }} shadows>
            <ThreeDExperience
              animation={'Idle'}
              facialExpression="default"
              lipsync={lipsync}
              audio={fakeAudio}
              cameraTargetY={3.6}
            />
          </Canvas>
        </div>
      </div>
      {/* Chat bubble overlay */}
      {lipsync && lastAIMessage && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30 w-full flex justify-center pointer-events-none">
          <div className="bg-white/90 border border-purple-200 rounded-2xl shadow-xl px-6 py-4 min-w-[200px] w-fit max-w-2xl text-gray-800 text-lg font-medium backdrop-blur-md animate-fade-in-up break-words pointer-events-auto">
            {lastAIMessage}
          </div>
        </div>
      )}
      {/* Input box overlay */}
      {/* Dark gradient behind input for better readability */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 via-black/10 to-transparent pointer-events-none z-10"></div>
      <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 w-full max-w-[1000px] flex justify-center z-20">
        <form
          className="flex items-center w-full max-w-[1000px] mx-4"
          onSubmit={handleSend}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Glassmorphism Input Container */}
          <div className="flex-1 relative group">
            <textarea
              key={textareaKey}
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type or speak your thoughts..."
              className="w-full px-6 py-4 pr-4 rounded-2xl bg-white/20 backdrop-blur-[12px] border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:bg-white/30 focus:border-blue-300/50 focus:shadow-[0_0_10px_rgba(147,197,253,0.3)] transition-all duration-300 font-semibold text-lg shadow-lg resize-none overflow-hidden"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                outline: 'none !important',
                borderColor: 'rgba(255, 255, 255, 0.3) !important',
                backgroundColor: 'rgba(255, 255, 255, 0.2) !important'
              }}
              disabled={isLoading || isSpeaking}
            />
            {/* Mood ring border animation on focus */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400/20 via-purple-400/20 to-blue-400/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
          
          {/* Floating Voice Orb */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`ml-3 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${
              isListening 
                ? 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-400/50' 
                : 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-blue-400/30'
            }`}
            disabled={isLoading || isSpeaking}
            title={isListening ? 'Stop Listening' : 'Talk to Sage'}
            style={{
              boxShadow: isListening 
                ? '0 0 20px rgba(147, 51, 234, 0.4), 0 8px 32px rgba(0, 0, 0, 0.2)' 
                : '0 8px 32px rgba(0, 0, 0, 0.15)'
            }}
          >
            {isListening ? (
              <div className="relative">
                <MicOff className="w-6 h-6 text-white" />
              </div>
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
          
          {/* Paper Plane Send Button */}
          <button
            type="submit"
            className={`ml-3 px-6 py-4 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl ${
              isLoading || isSpeaking
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600'
            }`}
            disabled={isLoading || isSpeaking}
            title="Send message to Sage"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {isLoading ? (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Send</span>
              </div>
            )}
          </button>
        </form>
      </div>
      {/* Listening indicator */}
      {isListening && (
        <div className="absolute left-1/2 bottom-32 transform -translate-x-1/2 z-40">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow-lg">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm font-medium">Listening... Speak now</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualCompanion;