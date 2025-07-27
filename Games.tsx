
import { useState } from "react";
import Navigation from "@/components/Navigation";
import BreatheWithMe from "@/components/games/BreatheWithMe";
import MoodGarden from "@/components/games/MoodGarden";
import ColorCalm from "@/components/games/ColorCalm";
import FlappyThoughts from "@/components/games/FlappyThoughts";

const Games = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    {
      id: "breathe",
      title: "Breathe With Me",
      description: "Follow the gentle circle to find your calm rhythm",
      icon: "🫁",
      color: "bg-blue-100",
      difficulty: "Beginner",
      duration: "2-5 min",
      points: "20 pts per session"
    },
    {
      id: "garden",
      title: "Mood Garden",
      description: "Plant seeds of positivity and watch them grow",
      icon: "🌱",
      color: "bg-green-100",
      difficulty: "Easy",
      duration: "5-10 min",
      points: "15 pts per plant"
    },
    {
      id: "color",
      title: "Color Calm",
      description: "Paint away stress with soothing patterns",
      icon: "🎨",
      color: "bg-purple-100",
      difficulty: "Relaxing",
      duration: "10-20 min",
      points: "25 pts per artwork"
    },
    {
      id: "flappy",
      title: "Flappy Thoughts",
      description: "Navigate through challenges with positive affirmations",
      icon: "🕊️",
      color: "bg-pink-100",
      difficulty: "Fun",
      duration: "3-7 min",
      points: "1 pt per 2 obstacles"
    }
  ];

  const renderActiveGame = () => {
    switch (activeGame) {
      case "breathe":
        return <BreatheWithMe onClose={() => setActiveGame(null)} />;
      case "garden":
        return <MoodGarden onClose={() => setActiveGame(null)} />;
      case "color":
        return <ColorCalm onClose={() => setActiveGame(null)} />;
      case "flappy":
        return <FlappyThoughts onClose={() => setActiveGame(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-green-50">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Healing Games 🎮
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Soothing activities designed to calm your mind and lift your spirit
            </p>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 inline-block shadow-lg border border-white/20">
              <p className="text-sm text-gray-600">
                💡 <strong>Tip:</strong> Play when you need a gentle break or want to earn wellness points
              </p>
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {games.map((game) => (
              <div
                key={game.id}
                className={`${game.color} rounded-3xl p-8 shadow-xl border border-white/20 hover:scale-105 transition-all duration-300 group cursor-pointer`}
                onClick={() => setActiveGame(game.id)}
              >
                <div className="flex items-start space-x-6">
                  <div className="text-6xl">{game.icon}</div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                      {game.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {game.description}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                        <div className="text-sm font-medium text-gray-700">{game.difficulty}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="text-sm font-medium text-gray-700">{game.duration}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Rewards</div>
                        <div className="text-sm font-medium text-gray-700">{game.points}</div>
                      </div>
                    </div>
                    
                    <button className="bg-white/80 hover:bg-white text-gray-800 font-medium px-6 py-3 rounded-full shadow-lg transition-all duration-200 group-hover:shadow-xl">
                      Start Playing →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Games */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              More Healing Experiences Coming Soon ✨
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "🎵", title: "Sound Sanctuary", desc: "Healing audio experiences" },
                { icon: "🧩", title: "Mindful Puzzles", desc: "Gentle brain exercises" },
                { icon: "🌙", title: "Sleep Stories", desc: "Bedtime guided journeys" }
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-100 rounded-3xl p-6 text-center opacity-60 border border-gray-200"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-8 text-center shadow-xl border border-white/20">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Play Your Way to Peace
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These aren't just games - they're gentle tools for healing. Take your time, 
              be kind to yourself, and remember that every small step counts. You're doing great! 🌟
            </p>
          </div>
        </div>
      </div>

      {/* Render Active Game */}
      {renderActiveGame()}
    </div>
  );
};

export default Games;
