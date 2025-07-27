
import Navigation from "@/components/Navigation";
import { usePoints } from "@/contexts/PointsContext";
import { useToast } from "@/hooks/use-toast";
import { gardenShopItems } from "@/lib/gardenShopItems";

// Helper to update Mood Garden inventory in localStorage
function updateMoodGardenInventory(item: any) {
  const saved = localStorage.getItem('moodGardenInventory');
  let inventory = saved ? JSON.parse(saved) : {
    pots: 3,
    seeds: { hopeful: 0, grateful: 0, joyful: 0, resilient: 0, peaceful: 0 },
    water: 0,
    sunlight: 0,
    fertilizer: { basic: 0, advanced: 0 }
  };

  if (item.type === 'pot') {
    inventory.pots += 1;
  } else if (item.type && item.type.startsWith('seed-')) {
    const seedType = item.type.split('-')[1];
    if (inventory.seeds[seedType] !== undefined) {
      inventory.seeds[seedType] += 3;
    }
  } else if (item.type === 'water') {
    inventory.water += 5;
  } else if (item.type === 'sunlight') {
    inventory.sunlight += 3;
  } else if (item.type && item.type.startsWith('fertilizer-')) {
    const fertType = item.type.split('-')[1];
    if (inventory.fertilizer[fertType] !== undefined) {
      inventory.fertilizer[fertType] += 1;
    }
  }
  localStorage.setItem('moodGardenInventory', JSON.stringify(inventory));
}

const Store = () => {
  const { points, spendPoints } = usePoints();
  const { toast } = useToast();
  
  const storeItems = [
    {
      category: "Mood Garden",
      items: gardenShopItems
    },
    {
      category: "Game Themes",
      items: [
        { name: "Ocean Calm", price: 300, icon: "🌊", description: "Peaceful blue themes" },
        { name: "Forest Serenity", price: 350, icon: "🌲", description: "Nature-inspired visuals" },
        { name: "Sunset Dreams", price: 400, icon: "🌅", description: "Warm evening colors" },
      ]
    },
    {
      category: "Color Calm",
      items: [
        { name: "Mandala Pack", price: 200, icon: "🎨", description: "Sacred geometry patterns" },
        { name: "Nature Scenes", price: 250, icon: "🏞️", description: "Landscapes to color" },
        { name: "Premium Brushes", price: 300, icon: "🖌️", description: "Professional tools" },
      ]
    }
  ];

  const handlePurchase = (item: any) => {
    const isMoodGardenItem = !!item.type;
    if (spendPoints(item.price)) {
      if (isMoodGardenItem) {
        updateMoodGardenInventory(item);
      }
      toast({
        title: "Purchase Successful! 🎉",
        description: `You bought ${item.name} for ${item.price} points`,
      });
    } else {
      toast({
        title: "Not enough points 😔",
        description: `You need ${item.price - points} more points to buy ${item.name}`,
        variant: "destructive"
      });
    }
  };

  const moodGardenCategories = [
    { title: "Emotion Seeds", category: "seeds" },
    { title: "Plant Care", category: "care" },
    { title: "Expansion", category: "expansion" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-green-50">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Reward Store 🛍️
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Treat yourself with earned points
            </p>
            <div className="inline-flex items-center space-x-2 bg-yellow-400 px-6 py-3 rounded-full shadow-lg">
              <span className="text-lg">🪙</span>
              <span className="font-bold text-lg">{points.toLocaleString()}</span>
              <span className="text-sm text-gray-700">points</span>
            </div>
          </div>

          {/* Store Categories */}
          {storeItems.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {category.category}
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-all duration-300"
                  >
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">{item.icon}</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {item.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">🪙</span>
                        <span className="font-bold text-lg">{item.price}</span>
                      </div>
                      
                      <button
                        onClick={() => handlePurchase(item)}
                        className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                          points >= item.price
                            ? "bg-pink-500 text-white hover:bg-pink-600 shadow-lg"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={points < item.price}
                      >
                        {points >= item.price ? "Buy" : "Need More"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          

          {/* Earn Points Section */}
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-8 text-center shadow-xl border border-white/20">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Need More Points? 💫
            </h3>
            <p className="text-gray-600 mb-6">
              Keep checking in, journaling, and playing games to earn more rewards!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/50 rounded-2xl p-4">
                <div className="text-2xl mb-2">📅</div>
                <div className="font-medium">Daily Check-in</div>
                <div className="text-pink-500">+15 pts</div>
              </div>
              <div className="bg-white/50 rounded-2xl p-4">
                <div className="text-2xl mb-2">✍️</div>
                <div className="font-medium">Journal Entry</div>
                <div className="text-pink-500">+25 pts</div>
              </div>
              <div className="bg-white/50 rounded-2xl p-4">
                <div className="text-2xl mb-2">🎮</div>
                <div className="font-medium">Play Games</div>
                <div className="text-pink-500">+10 pts</div>
              </div>
              <div className="bg-white/50 rounded-2xl p-4">
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-medium">Streak Bonus</div>
                <div className="text-pink-500">+50 pts</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;
