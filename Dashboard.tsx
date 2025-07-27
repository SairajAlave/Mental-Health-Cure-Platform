import { useState } from "react";
import Navigation from "@/components/Navigation";
import MoodCheckIn from "@/components/MoodCheckIn";
import { Link } from "react-router-dom";
import { usePoints } from "@/contexts/PointsContext";

const Dashboard = () => {
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const { points } = usePoints();

  const stats = [
    { icon: "📅", label: "Current Streak", value: "3 days", color: "bg-pink-100" },
    { icon: "✨", label: "Total Points", value: points.toLocaleString(), color: "bg-purple-100" },
    { icon: "💖", label: "Wellness Score", value: "85%", color: "bg-green-100" },
    { icon: "🎯", label: "Weekly Goal", value: "4/7 days", color: "bg-blue-100" },
  ];

  const journeyCards = [
    {
      icon: "🎮",
      title: "Play & Heal",
      description: "Soothing mini-games for your mind",
      color: "bg-purple-100",
      path: "/games"
    },
    {
      icon: "✍️",
      title: "Reflect & Write",
      description: "Private space for your thoughts",
      color: "bg-blue-100",
      path: "/journal"
    },
    {
      icon: "🤖",
      title: "AI Companion",
      description: "Always here to listen",
      color: "bg-green-100",
      path: "/ai-companion"
    },
    {
      icon: "🛍️",
      title: "Reward Store",
      description: "Treat yourself with earned points",
      color: "bg-yellow-100",
      path: "/store"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-green-50">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome back, friend 🌱
            </h1>
            <p className="text-lg text-gray-600">
              A space to reflect, relax, and grow. You're doing your best, and that's enough.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`${stat.color} rounded-2xl p-6 shadow-lg border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-200`}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Mood Check-In Section */}
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                How are you feeling today?
              </h2>
              <p className="text-gray-600">
                Every check-in is a step toward clarity ✨
              </p>
            </div>

            <div className="flex justify-center space-x-4 mb-6">
              {[
                { emoji: "😡", label: "Frustrated", color: "hover:bg-red-100" },
                { emoji: "😢", label: "Sad", color: "hover:bg-blue-100" },
                { emoji: "😐", label: "Okay", color: "hover:bg-gray-100" },
                { emoji: "🙂", label: "Good", color: "hover:bg-green-100" },
                { emoji: "😄", label: "Amazing", color: "hover:bg-yellow-100" },
              ].map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setShowMoodCheckIn(true)}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 ${mood.color} hover:scale-110`}
                >
                  <span className="text-4xl">{mood.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Healing Journey Cards */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Choose Your Healing Journey
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {journeyCards.map((card, index) => (
                <Link
                  key={index}
                  to={card.path}
                  className={`${card.color} rounded-3xl p-8 shadow-xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 group`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{card.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{card.description}</p>
                      <span className="text-pink-500 font-medium group-hover:text-pink-600">
                        Explore →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="bg-pink-100 rounded-3xl p-8 text-center shadow-lg border border-white/20">
            <div className="text-3xl mb-4">💚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Every moment of self-care matters
            </h3>
            <p className="text-gray-600">
              You're building healthy habits one check-in at a time. Keep going!
            </p>
          </div>
        </div>
      </div>

      {showMoodCheckIn && (
        <MoodCheckIn onClose={() => setShowMoodCheckIn(false)} />
      )}
    </div>
  );
};

export default Dashboard;
