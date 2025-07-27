import React, { useEffect, useState } from 'react';

interface AvatarTalkingProps {
  isSpeaking: boolean;
  className?: string;
}

const AvatarTalking: React.FC<AvatarTalkingProps> = ({ isSpeaking, className = "" }) => {
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 180); // toggle every 180ms for natural lip-sync
    } else {
      setMouthOpen(false); // reset to closed when not speaking
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSpeaking]);

  return (
    <img
      src={`/${mouthOpen ? 'mouthopen.png' : 'mouthclose.png'}`}
      alt="Talking Avatar"
      className={`transition-opacity duration-75 ${className}`}
    />
  );
};

export default AvatarTalking; 