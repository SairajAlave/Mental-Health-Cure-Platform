import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePoints } from "@/contexts/PointsContext";
import { useBadges } from "@/contexts/BadgesContext";

interface BreatheWithMeProps {
  onClose: () => void;
}

const BreatheWithMe = ({ onClose }: BreatheWithMeProps) => {
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const { addPoints } = usePoints();
  const { updateProgress } = useBadges();

  useEffect(() => {
    if (!isBreathing) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (phase === 'inhale') {
            setPhase('hold');
            return 2; // Hold for 2 seconds
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 4; // Exhale for 4 seconds
          } else {
            setPhase('inhale');
            setCycleCount(count => count + 1);
            return 4; // Inhale for 4 seconds
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathing, phase]);

  const handleStart = () => {
    setIsBreathing(true);
    setCycleCount(0);
    setPhase('inhale');
    setTimeLeft(4);
  };

  const handleStop = () => {
    setIsBreathing(false);
    if (cycleCount >= 3) {
      addPoints(20, 'Breathing session completed');
      updateProgress('breathing');
    }
  };

  const getCircleSize = () => {
    if (phase === 'inhale') return 'w-32 h-32';
    if (phase === 'hold') return 'w-36 h-36';
    return 'w-24 h-24';
  };

  const getInstruction = () => {
    if (phase === 'inhale') return 'Breathe In...';
    if (phase === 'hold') return 'Hold...';
    return 'Breathe Out...';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            🫁 Breathe With Me
          </h2>
          <p className="text-gray-600">
            Follow the circle and find your calm rhythm
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div
            className={`${getCircleSize()} rounded-full bg-gradient-to-br from-blue-400 to-purple-400 transition-all duration-1000 ease-in-out flex items-center justify-center shadow-lg`}
          >
            <span className="text-white font-semibold text-lg">
              {timeLeft}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xl font-medium text-gray-700 mb-2">
            {getInstruction()}
          </p>
          <p className="text-sm text-gray-500">
            Cycle {cycleCount} • Complete 3 cycles for points
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-full"
          >
            Close
          </Button>
          {!isBreathing ? (
            <Button
              onClick={handleStart}
              className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-full"
            >
              Start Breathing
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              className="flex-1 bg-green-500 hover:bg-green-600 rounded-full"
            >
              Finish (+20 pts)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreatheWithMe;
