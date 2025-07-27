import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-green-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-16 w-[63px] flex items-center justify-center overflow-hidden">
              <img 
                src="/mindgarden-logo.png" 
                alt="MindGarden" 
                className="h-full w-full" 
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">MindGarden</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A space to reflect, relax, and grow. You're doing your best, and that's enough.
          </p>
        </div>

        {/* Preview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-700 mb-1">Track Progress</h3>
            <p className="text-sm text-gray-500">Monitor your wellness journey</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-2">🎮</div>
            <h3 className="font-semibold text-gray-700 mb-1">Healing Games</h3>
            <p className="text-sm text-gray-500">Soothing mini-games for peace</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-2">✍️</div>
            <h3 className="font-semibold text-gray-700 mb-1">Private Journal</h3>
            <p className="text-sm text-gray-500">Safe space for your thoughts</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-semibold text-gray-700 mb-1">AI Companion</h3>
            <p className="text-sm text-gray-500">Always here to listen</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="text-center space-y-4">
          <Link to="/dashboard">
            <Button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300">
              Begin Your Journey 🌸
            </Button>
          </Link>
          <div>
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
              Explore First →
            </Link>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="text-center mt-16">
          <p className="text-gray-600 italic max-w-lg mx-auto">
            "Every moment of self-care matters. You're building healthy habits one check-in at a time."
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
