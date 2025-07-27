import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { usePoints } from "@/contexts/PointsContext";

interface FlappyThoughtsProps {
  onClose: () => void;
}

interface Bird {
  y: number;
  velocity: number;
}

interface Obstacle {
  x: number;
  gap: number;
  gapY: number;
  passed: boolean;
  type: 'negative' | 'positive';
}

const FlappyThoughts = ({ onClose }: FlappyThoughtsProps) => {
  const [gameState, setGameState] = useState<'menu' | 'countdown' | 'playing' | 'gameOver'>('menu');
  const [bird, setBird] = useState<Bird>({ y: 200, velocity: 0 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappyThoughtsHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameSpeed, setGameSpeed] = useState(2);
  const { addPoints } = usePoints();
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Only allow jump during playing
  const jump = useCallback(() => {
    if (gameState === 'playing') {
      setBird(prev => ({ ...prev, velocity: -8 }));
    }
  }, [gameState]);

  const startGame = () => {
    setGameState('countdown');
    setCountdown(3);
    setBird({ y: 200, velocity: 0 });
    setObstacles([]);
    setScore(0);
    setGameSpeed(2);
    setPaused(false);
  };

  const endGame = () => {
    setGameState('gameOver');
    const pointsEarned = Math.floor(score / 2);
    if (pointsEarned > 0) {
      addPoints(pointsEarned, `Flappy Thoughts score: ${score}`);
    }
    // High score logic
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappyThoughtsHighScore', String(score));
    }
  };

  // Modified game loop to respect pause
  useEffect(() => {
    if (gameState !== 'playing' || paused) return;
    const gameLoop = setInterval(() => {
      // Update bird physics
      setBird(prev => ({
        y: prev.y + prev.velocity,
        velocity: prev.velocity + 0.5 // gravity
      }));

      // Update obstacles
      setObstacles(prev => {
        let newObstacles = prev.map(obs => ({ ...obs, x: obs.x - gameSpeed }));
        
        // Remove off-screen obstacles
        newObstacles = newObstacles.filter(obs => obs.x > -100);
        
        // Add new obstacles
        if (newObstacles.length === 0 || newObstacles[newObstacles.length - 1].x < 300) {
          const isNegative = Math.random() > 0.3;
          newObstacles.push({
            x: 500,
            gap: 150,
            gapY: 100 + Math.random() * 200,
            passed: false,
            type: isNegative ? 'negative' : 'positive'
          });
        }
        
        return newObstacles;
      });

      // Check for scoring
      setObstacles(prev => prev.map(obs => {
        if (!obs.passed && obs.x < 50) {
          setScore(s => s + 1);
          return { ...obs, passed: true };
        }
        return obs;
      }));

    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState, gameSpeed, paused]);

  // Collision detection
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check ground/ceiling collision
    if (bird.y < 0 || bird.y > 400) {
      endGame();
      return;
    }

    // Check obstacle collision
    const birdRect = { x: 45, y: bird.y, width: 30, height: 30 };
    
    for (const obstacle of obstacles) {
      if (obstacle.x < 80 && obstacle.x > 20) {
        // Check if bird is in the gap
        if (bird.y < obstacle.gapY - 75 || bird.y > obstacle.gapY + 75) {
          endGame();
          return;
        }
      }
    }
  }, [bird.y, obstacles, gameState]);

  // Keyboard controls for pause/resume
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        setPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  // Countdown effect
  useEffect(() => {
    if (gameState !== 'countdown' || countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setGameState('playing');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, gameState]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-pink-50 to-blue-50 rounded-3xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            🕊️ Flappy Thoughts
          </h2>
          <p className="text-gray-600">
            Navigate through challenges with grace and positivity
          </p>
          <div className="mt-2 text-lg font-bold text-pink-600">
            High Score: {highScore}
          </div>
        </div>

        {/* Game Area */}
        <div 
          className="relative bg-gradient-to-b from-sky-100 via-blue-50 to-green-50 rounded-2xl overflow-hidden cursor-pointer mx-auto"
          style={{ width: '500px', height: '400px' }}
          onClick={jump}
        >
          {/* Countdown Overlay */}
          {gameState === 'countdown' && countdown !== null && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-30">
              <div className="text-6xl font-bold text-pink-500 mb-2 animate-pulse">
                {countdown === 0 ? 'Go!' : countdown}
              </div>
            </div>
          )}
          {/* Pause Button */}
          {gameState === 'playing' && !paused && countdown === null && (
            <button
              className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow border text-gray-700 hover:bg-gray-100 z-10"
              onClick={e => { e.stopPropagation(); setPaused(true); }}
              aria-label="Pause game"
            >
              ||
            </button>
          )}
          {/* Resume Overlay */}
          {paused && gameState === 'playing' && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20">
              <div className="text-3xl mb-4">⏸️ Paused</div>
              <button
                className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full text-lg font-semibold shadow"
                onClick={e => { e.stopPropagation(); setPaused(false); }}
                aria-label="Resume game"
              >
                ▶ Resume
              </button>
              <div className="mt-2 text-gray-500 text-sm">Press P or Escape to resume</div>
            </div>
          )}

          {/* Bird */}
          {gameState !== 'menu' && (
            <div
              className="absolute w-8 h-8 transition-transform duration-75 flex items-center justify-center"
              style={{ 
                left: '50px', 
                top: `${bird.y}px`,
                transform: `rotate(${Math.max(-30, Math.min(bird.velocity * 2, 30))}deg)`
              }}
            >
              <img
                src={bird.velocity < 0 ? '/bird-up.png' : '/bird-down.png'}
                alt="bird"
                className="w-8 h-8"
                draggable={false}
              />
            </div>
          )}

          {/* Obstacles */}
          {obstacles.map((obstacle, index) => (
            <div key={index}>
              {/* Top obstacle */}
              <div
                className={`absolute w-20 rounded-b-2xl shadow-md border-2 ${
                  obstacle.type === 'negative' 
                    ? 'bg-gradient-to-b from-rose-200 to-rose-300 border-rose-400' 
                    : 'bg-gradient-to-b from-emerald-200 to-emerald-300 border-emerald-400'
                }`}
                style={{
                  left: `${obstacle.x}px`,
                  top: '0px',
                  height: `${obstacle.gapY - 80}px`
                }}
              />
              
              {/* Bottom obstacle */}
              <div
                className={`absolute w-20 rounded-t-2xl shadow-md border-2 ${
                  obstacle.type === 'negative' 
                    ? 'bg-gradient-to-t from-rose-200 to-rose-300 border-rose-400' 
                    : 'bg-gradient-to-t from-emerald-200 to-emerald-300 border-emerald-400'
                }`}
                style={{
                  left: `${obstacle.x}px`,
                  top: `${obstacle.gapY + 80}px`,
                  height: `${400 - (obstacle.gapY + 80)}px`
                }}
              />
            </div>
          ))}

          {/* Game State Overlays */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🕊️</div>
                <p className="text-gray-600 mb-4">Tap or press Space to fly</p>
                <p className="text-sm text-gray-500">Navigate between the obstacles</p>
                <div className="mt-4 text-xl font-bold text-pink-600">High Score: {highScore}</div>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-xl font-semibold text-gray-800 mb-2">Beautiful Flight!</p>
                <p className="text-gray-600 mb-2">Score: {score}</p>
                <p className="text-sm text-green-600">+{Math.floor(score / 2)} points earned</p>
                
                {score === highScore && score > 0 && (
                  <div className="mt-2 text-green-700 font-semibold">🎉 New High Score!</div>
                )}
              </div>
            </div>
          )}

          {/* Score Display */}
          {gameState === 'playing' && (
            <div className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded-full shadow-lg border-2 border-white flex flex-col items-start">
              <span className="font-bold text-gray-800">Score: {score}</span>
              
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500 mb-4">
          {gameState === 'playing' && 'Tap the game area or press Space to fly gracefully!'}
          {gameState === 'menu' && 'Guide your bird through a peaceful journey'}
          {gameState === 'gameOver' && `You navigated through ${score} obstacles beautifully!`}
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-full"
          >
            Close
          </Button>
          {gameState !== 'playing' && (
            <Button
              onClick={startGame}
              className="flex-1 bg-pink-500 hover:bg-pink-600 rounded-full"
            >
              {gameState === 'menu' ? 'Start Game' : 'Play Again'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlappyThoughts;