
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePoints } from "@/contexts/PointsContext";
import { useToast } from "@/components/ui/use-toast";
import { useBadges } from "@/contexts/BadgesContext";

interface MoodCheckInProps {
  onClose: () => void;
}

const MoodCheckIn = ({ onClose }: MoodCheckInProps) => {
  const [selectedMood, setSelectedMood] = useState("");
  const [reflection, setReflection] = useState("");
  const { addPoints } = usePoints();
  const { toast } = useToast();
  const { updateProgress } = useBadges();

  // Helper to get today's date as YYYY-MM-DD
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const moods = [
    { emoji: "😡", label: "Frustrated", suggestion: "Try our breathing exercise" },
    { emoji: "😢", label: "Sad", suggestion: "Journaling might help today" },
    { emoji: "😐", label: "Okay", suggestion: "How about a quick game?" },
    { emoji: "🙂", label: "Good", suggestion: "Keep the momentum going!" },
    { emoji: "😄", label: "Amazing", suggestion: "Share your joy in the garden!" },
  ];

  const handleSubmit = () => {
    if (!selectedMood) {
      return;
    }
    // Save today's date
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = localStorage.getItem('lastMoodCheckIn');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let streak = parseInt(localStorage.getItem('checkInStreak') || '0', 10);
    if (lastCheckIn === today) {
      toast({
        title: "Already checked in!",
        description: "You have already checked in today. Come back tomorrow for more points! 🌱",
        variant: "default"
      });
      onClose();
      return;
    }
    if (lastCheckIn === yesterdayStr) {
      streak += 1;
    } else {
      streak = 1;
    }
    localStorage.setItem('checkInStreak', streak.toString());
    const basePoints = 15;
    const bonusPoints = 10 * (streak - 1);
    const totalPoints = basePoints + bonusPoints;
    addPoints(totalPoints, `Mood check-in (Streak: ${streak})`);
    updateProgress('checkin');
    localStorage.setItem('lastMoodCheckIn', today);
    localStorage.setItem('lastMoodCheckInMood', selectedMood);
    toast({
      title: `Daily Check-In! 🌟`,
      description: `You earned ${basePoints} pts + ${bonusPoints} streak bonus! (Streak: ${streak} days)`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            How are you feeling right now?
          </h2>
          <p className="text-gray-600">
            Take a moment to check in with yourself
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {moods.map((mood) => (
            <button
              key={mood.label}
              onClick={() => setSelectedMood(mood.label)}
              className={`flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 ${
                selectedMood === mood.label
                  ? "bg-pink-100 border-2 border-pink-300"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-xs font-medium text-gray-700">
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="mb-6">
            <div className="bg-green-50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-green-700">
                💡 {moods.find(m => m.label === selectedMood)?.suggestion}
              </p>
            </div>
            
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What's on your mind? (optional)"
              className="w-full p-4 border border-gray-200 rounded-2xl resize-none h-24 text-sm"
            />
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-full"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMood}
            className="flex-1 bg-pink-500 hover:bg-pink-600 rounded-full"
          >
            Check In (+15 pts)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoodCheckIn;
