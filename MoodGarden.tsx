import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePoints } from "@/contexts/PointsContext";
import { useBadges } from "@/contexts/BadgesContext";
import { Card } from "@/components/ui/card";
import { gardenShopItems } from "@/lib/gardenShopItems";

interface MoodGardenProps {
  onClose: () => void;
}

interface Plant {
  id: number;
  type: 'hopeful' | 'grateful' | 'joyful' | 'resilient' | 'peaceful';
  stage: 'seed' | 'sprout' | 'mature';
  plantedAt: number;
  slot: number;
  maturityTime: number; // in hours
}

interface Inventory {
  pots: number;
  seeds: {
    hopeful: number;
    grateful: number;
    joyful: number;
    resilient: number;
    peaceful: number;
  };
  water: number;
  sunlight: number;
  fertilizer: {
    basic: number;
    advanced: number;
  };
}

const MoodGarden = ({ onClose }: MoodGardenProps) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'garden'>('shop');
  // Load from localStorage or use defaults
  const [plants, setPlants] = useState<Plant[]>(() => {
    const saved = localStorage.getItem('moodGardenPlants');
    return saved ? JSON.parse(saved) : [];
  });
  const [inventory, setInventory] = useState<Inventory>(() => {
    const saved = localStorage.getItem('moodGardenInventory');
    return saved ? JSON.parse(saved) : {
      pots: 3,
      seeds: { hopeful: 0, grateful: 0, joyful: 0, resilient: 0, peaceful: 0 },
      water: 0,
      sunlight: 0,
      fertilizer: { basic: 0, advanced: 0 }
    };
  });
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  const { points, spendPoints } = usePoints();
  const { updateProgress } = useBadges();

  const seedTypes = {
    hopeful: { emoji: '🌱', color: 'bg-green-100', mature: '🌿', name: 'Hopeful' },
    grateful: { emoji: '🌸', color: 'bg-pink-100', mature: '🌺', name: 'Grateful' },
    joyful: { emoji: '🌻', color: 'bg-yellow-100', mature: '🌻', name: 'Joyful' },
    resilient: { emoji: '🌵', color: 'bg-orange-100', mature: '🌵', name: 'Resilient' },
    peaceful: { emoji: '🌳', color: 'bg-blue-100', mature: '🌳', name: 'Peaceful' }
  };

  // Replace the local shopItems array with gardenShopItems
  const shopItems = gardenShopItems;

  // Update plant growth every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setPlants(prevPlants => 
        prevPlants.map(plant => {
          const timeElapsed = Date.now() - plant.plantedAt;
          const hoursElapsed = timeElapsed / (1000 * 60 * 60);
          
          // Simplified growth logic - if time has passed, mature directly
          if (plant.stage === 'seed' && hoursElapsed >= plant.maturityTime / 2) {
            return { ...plant, stage: 'sprout' as const };
          } else if (plant.stage === 'sprout' && hoursElapsed >= plant.maturityTime) {
            updateProgress('plant');
            return { ...plant, stage: 'mature' as const };
          } else if (plant.stage === 'seed' && hoursElapsed >= plant.maturityTime) {
            // Direct maturity if enough time has passed
            updateProgress('plant');
            return { ...plant, stage: 'mature' as const };
          }
          return plant;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [updateProgress]);

  // Persist plants and inventory to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('moodGardenPlants', JSON.stringify(plants));
  }, [plants]);
  useEffect(() => {
    localStorage.setItem('moodGardenInventory', JSON.stringify(inventory));
  }, [inventory]);

  const buyItem = (item: any) => {
    if (!spendPoints(item.price)) return;

    if (item.type === 'pot') {
      setInventory(prev => ({ ...prev, pots: prev.pots + 1 }));
    } else if (item.type.startsWith('seed-')) {
      const seedType = item.type.split('-')[1] as keyof typeof inventory.seeds;
      setInventory(prev => ({
        ...prev,
        seeds: { ...prev.seeds, [seedType]: prev.seeds[seedType] + 3 }
      }));
    } else if (item.type === 'water') {
      setInventory(prev => ({ ...prev, water: prev.water + 5 }));
    } else if (item.type === 'sunlight') {
      setInventory(prev => ({ ...prev, sunlight: prev.sunlight + 3 }));
    } else if (item.type.startsWith('fertilizer-')) {
      const fertType = item.type.split('-')[1] as keyof typeof inventory.fertilizer;
      setInventory(prev => ({
        ...prev,
        fertilizer: { ...prev.fertilizer, [fertType]: prev.fertilizer[fertType] + 1 }
      }));
    }
  };

  const plantSeed = (seedType: string, slot: number) => {
    if (inventory.seeds[seedType as keyof typeof inventory.seeds] > 0) {
      const newPlant: Plant = {
        id: Date.now(),
        type: seedType as Plant['type'],
        stage: 'seed',
        plantedAt: Date.now(),
        slot,
        maturityTime: 24 // 24 hours
      };
      
      setPlants(prev => [...prev, newPlant]);
      setInventory(prev => ({
        ...prev,
        seeds: {
          ...prev.seeds,
          [seedType]: prev.seeds[seedType as keyof typeof prev.seeds] - 1
        }
      }));
      setSelectedSeed(null);
      setSelectedSlot(null);
    }
  };

  const waterPlant = (plantId: number) => {
    if (inventory.water > 0) {
      setInventory(prev => ({ ...prev, water: prev.water - 1 }));
      // Watering could add a small growth boost (currently just cosmetic)
    }
  };

  const applySunlight = (plantId: number) => {
    if (inventory.sunlight > 0) {
      setPlants(prevPlants => 
        prevPlants.map(plant => {
          if (plant.id === plantId && plant.stage !== 'mature') {
            // Sunlight reduces remaining time by 2 hours
            const timeBoost = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
            const newPlantedAt = plant.plantedAt - timeBoost;
            
            // Check if plant should mature immediately
            const timeElapsed = Date.now() - newPlantedAt;
            const hoursElapsed = timeElapsed / (1000 * 60 * 60);
            
            if (hoursElapsed >= plant.maturityTime) {
              updateProgress('plant');
              return { ...plant, plantedAt: newPlantedAt, stage: 'mature' as const };
            }
            
            return { ...plant, plantedAt: newPlantedAt };
          }
          return plant;
        })
      );
      setInventory(prev => ({ ...prev, sunlight: prev.sunlight - 1 }));
    }
  };

  const applyFertilizer = (plantId: number, fertilizerType: 'basic' | 'advanced') => {
    if (inventory.fertilizer[fertilizerType] > 0) {
      setPlants(prevPlants => 
        prevPlants.map(plant => {
          if (plant.id === plantId && plant.stage !== 'mature') {
            // Basic fertilizer reduces time by 4 hours, advanced by 12 hours
            const timeReduction = fertilizerType === 'basic' ? 4 : 12;
            const timeBoost = timeReduction * 60 * 60 * 1000; // Convert to milliseconds
            const newPlantedAt = plant.plantedAt - timeBoost;
            
            // Check if plant should mature immediately
            const timeElapsed = Date.now() - newPlantedAt;
            const hoursElapsed = timeElapsed / (1000 * 60 * 60);
            
            if (hoursElapsed >= plant.maturityTime) {
              updateProgress('plant');
              return { ...plant, plantedAt: newPlantedAt, stage: 'mature' as const };
            }
            
            return { ...plant, plantedAt: newPlantedAt };
          }
          return plant;
        })
      );
      setInventory(prev => ({
        ...prev,
        fertilizer: {
          ...prev.fertilizer,
          [fertilizerType]: prev.fertilizer[fertilizerType] - 1
        }
      }));
    }
  };

  const getPlantDisplay = (plant: Plant) => {
    if (plant.stage === 'seed') return '🌰';
    if (plant.stage === 'sprout') return '🌱';
    return seedTypes[plant.type].mature;
  };

  const getTimeRemaining = (plant: Plant) => {
    const timeElapsed = Date.now() - plant.plantedAt;
    const hoursElapsed = timeElapsed / (1000 * 60 * 60);
    const remaining = plant.maturityTime - hoursElapsed;
    
    if (plant.stage === 'mature') return 'Mature!';
    if (remaining <= 0) return 'Ready!';
    
    if (remaining < 1) {
      return `${Math.ceil(remaining * 60)}min`;
    }
    return `${Math.ceil(remaining)}h`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-green-50 via-blue-50 to-pink-50 rounded-3xl p-6 max-w-5xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto border-4 border-green-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-4 border-2 border-green-200 mb-4">
            <h2 className="text-3xl font-bold text-green-800 mb-2">🌱 Mood Garden</h2>
            <p className="text-green-700 mb-3">Plant seeds of healing and watch them grow!</p>
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1 bg-yellow-400 px-3 py-2 rounded-full border-2 border-yellow-500">
                <span>🪙</span>
                <span className="font-bold text-lg">{points}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 bg-white/80 p-2 rounded-2xl border-2 border-green-200 shadow-lg">
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'shop'
                  ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              🛒 Shop
            </button>
            <button
              onClick={() => setActiveTab('garden')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'garden'
                  ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              🌱 My Garden
            </button>
          </div>
        </div>

        {activeTab === 'shop' ? (
          /* SHOP TAB */
          <div className="space-y-6">
            {/* Seeds Section */}
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-2 border-pink-200 shadow-xl">
              <h3 className="text-2xl font-bold text-pink-800 mb-4 text-center">🌱 Emotion Seeds</h3>
              <div className="grid grid-cols-5 gap-4">
                {shopItems.filter(item => item.category === 'seeds').map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 text-center shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <div className="text-sm font-bold text-gray-800 mb-2">{item.name}</div>
                    <div className="flex items-center justify-center mb-3">
                      <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300">
                        <span className="text-sm">🪙</span>
                        <span className="text-sm font-bold">{item.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => buyItem(item)}
                      disabled={points < item.price}
                      className={`w-full px-3 py-2 rounded-full text-sm font-bold transition-all ${
                        points >= item.price
                          ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500 shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Buy 3 Seeds
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Care Items Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 p-6 border-2 border-blue-200 shadow-xl">
              <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">🧪 Plant Care</h3>
              <div className="grid grid-cols-4 gap-4">
                {shopItems.filter(item => item.category === 'care').map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 text-center shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <div className="text-sm font-bold text-gray-800 mb-2">{item.name}</div>
                    <div className="flex items-center justify-center mb-3">
                      <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300">
                        <span className="text-sm">🪙</span>
                        <span className="text-sm font-bold">{item.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => buyItem(item)}
                      disabled={points < item.price}
                      className={`w-full px-3 py-2 rounded-full text-sm font-bold transition-all ${
                        points >= item.price
                          ? 'bg-gradient-to-r from-blue-400 to-green-400 text-white hover:from-blue-500 hover:to-green-500 shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Buy
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Expansion Section */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-2 border-purple-200 shadow-xl">
              <h3 className="text-2xl font-bold text-purple-800 mb-4 text-center">🪴 Garden Expansion</h3>
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl p-6 text-center shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all">
                  <div className="text-4xl mb-3">🪴</div>
                  <div className="text-lg font-bold text-gray-800 mb-2">Extra Garden Pot</div>
                  <div className="text-sm text-gray-600 mb-4">Unlock a new planting slot</div>
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center space-x-1 bg-yellow-100 px-4 py-2 rounded-full border border-yellow-300">
                      <span>🪙</span>
                      <span className="text-lg font-bold">100</span>
                    </div>
                  </div>
                  <button
                    onClick={() => buyItem(shopItems.find(item => item.type === 'pot')!)}
                    disabled={points < 100}
                    className={`px-6 py-3 rounded-full font-bold transition-all ${
                      points >= 100
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Buy Pot
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* GARDEN TAB */
          <div className="space-y-6">
            {/* Inventory Display */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-2 border-green-200 shadow-xl">
              <h3 className="text-xl font-bold text-green-800 mb-4 text-center">📦 My Inventory</h3>
              <div className="grid grid-cols-6 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
                  <div className="text-3xl mb-2">🪴</div>
                  <div className="text-xs text-gray-600 mb-1">Pots</div>
                  <div className="text-lg font-bold text-green-600">{inventory.pots}</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
                  <div className="text-3xl mb-2">🌱</div>
                  <div className="text-xs text-gray-600 mb-1">Seeds</div>
                  <div className="text-lg font-bold text-green-600">
                    {Object.values(inventory.seeds).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
                  <div className="text-3xl mb-2">💧</div>
                  <div className="text-xs text-gray-600 mb-1">Water</div>
                  <div className="text-lg font-bold text-blue-600">{inventory.water}</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
                  <div className="text-3xl mb-2">☀️</div>
                  <div className="text-xs text-gray-600 mb-1">Sunlight</div>
                  <div className="text-lg font-bold text-yellow-600">{inventory.sunlight}</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
                  <div className="text-3xl mb-2">🧪</div>
                  <div className="text-xs text-gray-600 mb-1">Basic Fert</div>
                  <div className="text-lg font-bold text-purple-600">{inventory.fertilizer.basic}</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="text-xs text-gray-600 mb-1">Adv Fert</div>
                  <div className="text-lg font-bold text-purple-600">{inventory.fertilizer.advanced}</div>
                </div>
              </div>
            </Card>

            {/* Seed Selection Modal */}
            {selectedSlot !== null && (
              <Card className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-2 border-pink-200 shadow-xl">
                <h3 className="text-xl font-bold text-pink-800 mb-4 text-center">🌱 Choose a Seed to Plant</h3>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(inventory.seeds).map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => count > 0 ? plantSeed(type, selectedSlot) : null}
                      disabled={count === 0}
                      className={`p-4 rounded-xl text-center transition-all ${
                        count > 0
                          ? 'bg-white hover:bg-gray-50 shadow-md border-2 border-gray-200 hover:shadow-lg'
                          : 'bg-gray-100 opacity-50 cursor-not-allowed border-2 border-gray-100'
                      }`}
                    >
                      <div className="text-3xl mb-2">{seedTypes[type as keyof typeof seedTypes].emoji}</div>
                      <div className="text-sm font-bold text-gray-800">{seedTypes[type as keyof typeof seedTypes].name}</div>
                      <div className="text-xs text-gray-600 mt-1">x{count}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </Card>
            )}

            {/* Garden Grid */}
            <Card className="bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50 p-6 border-2 border-green-200 shadow-xl">
              <h3 className="text-2xl font-bold text-green-800 mb-6 text-center">🏡 My Healing Garden</h3>
              <div className="grid grid-cols-5 gap-4 min-h-[400px]">
                {Array.from({ length: inventory.pots }).map((_, i) => {
                  const plant = plants.find(p => p.slot === i);
                  return (
                    <div
                      key={i}
                      className={`bg-gradient-to-br from-amber-50 to-green-50 rounded-2xl p-4 text-center border-2 ${
                        plant ? 'border-green-300 shadow-lg' : 'border-dashed border-gray-300 hover:border-green-300'
                      } min-h-[140px] flex flex-col justify-center cursor-pointer transition-all hover:scale-105`}
                      onClick={() => !plant ? setSelectedSlot(i) : null}
                    >
                      {plant ? (
                        <>
                          <div className="text-5xl mb-3">{getPlantDisplay(plant)}</div>
                          <div className="text-sm font-bold text-gray-800">{seedTypes[plant.type].name}</div>
                          <div className="text-xs text-gray-600 mb-3">{getTimeRemaining(plant)}</div>
                          
                          {plant.stage !== 'mature' && (
                            <div className="flex flex-col space-y-2">
                              {inventory.water > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    waterPlant(plant.id);
                                  }}
                                  className="bg-blue-400 text-white text-xs px-2 py-1 rounded-full hover:bg-blue-500 transition-all"
                                >
                                  💧 Water
                                </button>
                              )}
                              
                              {inventory.sunlight > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applySunlight(plant.id);
                                  }}
                                  className="bg-yellow-400 text-white text-xs px-2 py-1 rounded-full hover:bg-yellow-500 transition-all"
                                >
                                  ☀️ Sunlight
                                </button>
                              )}
                              
                              {inventory.fertilizer.basic > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyFertilizer(plant.id, 'basic');
                                  }}
                                  className="bg-purple-400 text-white text-xs px-2 py-1 rounded-full hover:bg-purple-500 transition-all"
                                >
                                  🧪 Basic
                                </button>
                              )}
                              
                              {inventory.fertilizer.advanced > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyFertilizer(plant.id, 'advanced');
                                  }}
                                  className="bg-pink-400 text-white text-xs px-2 py-1 rounded-full hover:bg-pink-500 transition-all"
                                >
                                  ✨ Advanced
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-4xl text-gray-300 mb-3">🪴</div>
                          <div className="text-sm text-gray-500 font-medium">Tap to plant</div>
                        </>
                      )}
                    </div>
                  );
                })}
                
                {/* Locked slots */}
                {Array.from({ length: Math.max(0, 25 - inventory.pots) }).map((_, i) => (
                  <div
                    key={`locked-${i}`}
                    className="bg-gray-100 rounded-2xl p-4 text-center border-2 border-gray-200 min-h-[140px] flex flex-col justify-center opacity-60"
                  >
                    <div className="text-4xl text-gray-400 mb-3">🔒</div>
                    <div className="text-sm text-gray-500">Buy more pots</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 hover:from-green-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-full shadow-lg text-lg"
          >
            Save & Close 🌸
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoodGarden;
