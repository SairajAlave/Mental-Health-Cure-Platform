
import Navigation from "@/components/Navigation";
import { useBadges } from "@/contexts/BadgesContext";

const Badges = () => {
  const { badges } = useBadges();

  const earnedBadges = badges.filter(badge => badge.earned);
  const lockedBadges = badges.filter(badge => !badge.earned);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-green-50">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Badge Wall 🏅
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Celebrate your wellness journey milestones
            </p>
            <div className="inline-flex items-center space-x-4 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏆</span>
                <span className="font-bold text-lg">{earnedBadges.length}</span>
                <span className="text-sm text-gray-700">earned</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎯</span>
                <span className="font-bold text-lg">{lockedBadges.length}</span>
                <span className="text-sm text-gray-700">to unlock</span>
              </div>
            </div>
          </div>

          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">🌟</span>
                Your Achievements
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {earnedBadges.map((badge, index) => (
                  <div
                    key={index}
                    className={`${badge.color} rounded-3xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-all duration-300 relative overflow-hidden`}
                  >
                    {/* Sparkle effect for earned badges */}
                    <div className="absolute top-2 right-2 text-yellow-400 text-xl animate-pulse">
                      ✨
                    </div>
                    
                    <div className="text-center">
                      <div className="text-5xl mb-4">{badge.icon}</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {badge.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {badge.description}
                      </p>
                      <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        {badge.progress}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🔒</span>
              Keep Going!
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedBadges.map((badge, index) => (
                <div
                  key={index}
                  className="bg-gray-100 rounded-3xl p-6 shadow-lg border border-gray-200 opacity-75 hover:opacity-100 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-4 grayscale">{badge.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {badge.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {badge.description}
                    </p>
                    <div className="bg-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm">
                      {badge.progress}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivation Section */}
          <div className="mt-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-8 text-center shadow-xl border border-white/20">
            <div className="text-4xl mb-4">💝</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Every Step Counts
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each badge represents a moment you chose self-care. You're building something beautiful - 
              a healthier relationship with yourself. Keep growing, one day at a time. 🌱
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Badges;
