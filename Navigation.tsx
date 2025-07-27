import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePoints } from "@/contexts/PointsContext";

const Navigation = () => {
  const location = useLocation();
  const { points } = usePoints();
  
  const navItems = [
    { icon: "🏠", label: "Home", path: "/dashboard" },
    { icon: "🎮", label: "Games", path: "/games" },
    { icon: "📝", label: "Journal", path: "/journal" },
    { icon: "🛍️", label: "Store", path: "/store" },
    { icon: "🏅", label: "Badges", path: "/badges" },
    { icon: "🤖", label: "Chat", path: "/ai-companion" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-[29px] flex items-center justify-center overflow-hidden">
              <img 
                src="/mindgarden-logo.png" 
                alt="MindGarden" 
                className="h-full w-full" 
              />
            </div>
            <span className="text-lg font-semibold text-gray-700">MindGarden</span>
          </Link>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-pink-500 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 bg-yellow-400 px-3 py-1 rounded-full">
            <span className="text-sm">🪙</span>
            <span className="font-semibold">{points.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
