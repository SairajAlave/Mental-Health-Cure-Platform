import React, { useEffect, useState } from 'react';
import AvatarTalking from './AvatarTalking';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';

interface SageBubbleProps {
  message: string;
  onClose?: () => void;
}

const SageBubble: React.FC<SageBubbleProps> = ({ message, onClose }) => {
  const [hasSpoken, setHasSpoken] = useState(false);
  const {
    isSpeaking,
    speak,
    stopSpeaking,
    availableVoices,
  } = useVoiceInteraction({
    onSpeakComplete: () => setHasSpoken(true),
    onTranscript: () => {},
  });

  useEffect(() => {
    setHasSpoken(false);
    // Wait until voices are loaded and Google UK English Female is available
    if (
      message &&
      availableVoices.some(v => v.name.includes("Google UK English Female"))
    ) {
      speak(message, "Google UK English Female");
    }
    // Stop speaking on unmount
    return () => stopSpeaking();
    // eslint-disable-next-line
  }, [message, availableVoices]);

  return (
    <div className="fixed bottom-8 left-8 z-50 flex items-end animate-fade-in-up">
      <div className="flex items-end gap-3">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center overflow-hidden shadow-xl border-4 border-white/20">
          <AvatarTalking isSpeaking={isSpeaking} className="w-full h-full object-cover" />
        </div>
        <div className="relative">
          <div className="bg-white border border-purple-200 rounded-2xl shadow-xl px-5 py-3 max-w-xs text-gray-800 text-base font-medium">
            {message}
            {onClose && (
              <button 
                onClick={onClose} 
                className="absolute top-1 right-2 text-gray-400 hover:text-gray-700 text-lg transition-colors"
                title="Close message"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SageBubble; 