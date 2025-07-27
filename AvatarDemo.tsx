import React, { useState } from 'react';
import AvatarTalking from './AvatarTalking';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

const AvatarDemo: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    setIsSpeaking(true);
    // Simulate 4 seconds of talking
    setTimeout(() => setIsSpeaking(false), 4000);
  };

  const handleStop = () => {
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl">
      <h2 className="text-2xl font-bold text-gray-800">Avatar Lip-Sync Demo</h2>
      
      {/* Large Avatar Display */}
      <div className="relative">
        <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white/20">
          <AvatarTalking 
            isSpeaking={isSpeaking} 
            className="w-full h-full object-cover"
          />
        </div>
        {isSpeaking && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        <Button
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>Start Talking</span>
        </Button>
        
        <Button
          onClick={handleStop}
          disabled={!isSpeaking}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center space-x-2"
        >
          <Square className="w-4 h-4" />
          <span>Stop</span>
        </Button>
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-lg text-gray-700">
          Status: <span className={`font-semibold ${isSpeaking ? 'text-blue-600' : 'text-gray-500'}`}>
            {isSpeaking ? 'Speaking...' : 'Silent'}
          </span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          The avatar will alternate between open and closed mouth every 180ms when speaking
        </p>
      </div>
    </div>
  );
};

export default AvatarDemo; 