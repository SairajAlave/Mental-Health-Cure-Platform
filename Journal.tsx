
import { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePoints } from "@/contexts/PointsContext";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInteraction } from "@/hooks/useVoiceInteraction";
import { analyzeEmotion, generateEmpatheticResponse, extractCBTReframes, CBTReframe, getSmartThoughtBubble } from "@/utils/emotionAnalysis";
import SageBubble from "@/components/SageBubble";

const Journal = () => {
  const { addPoints } = usePoints();
  const { toast } = useToast();
  const [currentEntry, setCurrentEntry] = useState("");
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('mindgarden-journal-entries');
    if (saved) return JSON.parse(saved);
    return [
    {
      id: 1,
      date: "Today, 2:30 PM",
      preview: "Feeling grateful for the small moments today. The sunset was beautiful and reminded me that...",
      mood: "🙂",
      wordCount: 156
    },
    {
      id: 2,
      date: "Yesterday, 8:15 PM",
      preview: "Had a challenging day but I'm proud of how I handled the stress. Used the breathing exercise and...",
      mood: "💪",
      wordCount: 203
    },
    {
      id: 3,
      date: "2 days ago, 10:45 AM",
      preview: "Woke up feeling anxious but decided to write it out. Sometimes putting thoughts on paper helps...",
      mood: "😐",
      wordCount: 89
    }
    ];
  });
  // Streak system
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('mindgarden-journal-streak');
    return saved ? Number(saved) : 0;
  });
  const [lastEntryDate, setLastEntryDate] = useState(() => {
    return localStorage.getItem('mindgarden-journal-last-date') || '';
  });

  useEffect(() => {
    localStorage.setItem('mindgarden-journal-entries', JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem('mindgarden-journal-streak', streak.toString());
  }, [streak]);
  useEffect(() => {
    if (lastEntryDate) localStorage.setItem('mindgarden-journal-last-date', lastEntryDate);
  }, [lastEntryDate]);

  function isToday(dateStr) {
    const today = new Date();
    const date = new Date(dateStr);
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  }
  function isYesterday(dateStr) {
    const today = new Date();
    const date = new Date(dateStr);
    const diff = today - date;
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 && today.getDate() - date.getDate() === 1;
  }

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentMood, setCurrentMood] = useState('🙂');
  const [selectedMood, setSelectedMood] = useState(() => {
    return localStorage.getItem('lastMoodCheckInMood') || '';
  });
  useEffect(() => {
    const mood = localStorage.getItem('lastMoodCheckInMood');
    if (mood) {
      setSelectedMood(mood);
    }
  }, []);
  // Mood-based soft prompt mapping (by label)
  const moodPrompts = {
    'Frustrated': "What’s making you feel frustrated today?",
    'Sad': "What’s something you need to let go of today?",
    'Okay': "What’s on your mind right now?",
    'Good': "What’s something you’re looking forward to?",
    'Amazing': "What made today feel special?",
    'Tired': "What would rest look like for you today?",
    'Numb': "Even when you don’t feel much, what do you know to be true?",
    'Strong': "What’s giving you strength today?",
    'Hopeful': "What’s a hope you have for tomorrow?",
    'Reflective': "What’s a thought you want to remember?",
  };
  // Mood options with label and emoji
  const moodOptions = [
    { emoji: '😡', label: 'Frustrated' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '🙂', label: 'Good' },
    { emoji: '😄', label: 'Amazing' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😶', label: 'Numb' },
    { emoji: '💪', label: 'Strong' },
    { emoji: '🌈', label: 'Hopeful' },
    { emoji: '✍️', label: 'Reflective' },
  ];
  const moodPlaceholder = moodPrompts[selectedMood] || "Let your thoughts flow freely here. There's no right or wrong way to express yourself...";

  const [showAllEntries, setShowAllEntries] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 4;
  const totalPages = Math.ceil(entries.length / entriesPerPage);
  const paginatedEntries = entries.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const prompts = [
    "What am I grateful for today?",
    "How did I show kindness to myself?",
    "What challenged me, and how did I grow?",
    "What brought me joy today?",
    "What would I tell a friend going through this?",
    "How am I feeling right now, and why?"
  ];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    isListening,
    startListening,
    stopListening
  } = useVoiceInteraction({
    onTranscript: (text) => {
      setCurrentEntry((prev) => (prev ? prev + (prev.endsWith(' ') ? '' : ' ') + text : text));
      // Focus textarea after speech
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  });

  // Removed Reflection Modal state
  const [thoughtBubble, setThoughtBubble] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);

  // When saving a new entry, save both mood label and emoji
  const handleSaveEntry = () => {
    if (currentEntry.trim()) {
      const now = new Date();
      const formattedDate = now.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const isoDate = now.toISOString();
      // Find emoji for selectedMood
      const moodObj = moodOptions.find(m => m.label === selectedMood) || moodOptions[3]; // default to 'Good'
      const newEntry = {
        id: entries.length + 1,
        date: formattedDate,
        preview: currentEntry.substring(0, 100) + (currentEntry.length > 100 ? "..." : ""),
        mood: { label: moodObj.label, emoji: moodObj.emoji },
        wordCount: currentEntry.split(' ').length,
        fullText: currentEntry,
        isoDate
      };
      setEntries([newEntry, ...entries]);
      setCurrentEntry("");
      setCurrentMood('🙂');
      // Sentiment & reflection logic
      const analysis = analyzeEmotion(newEntry.fullText);
      if (["sad", "angry", "anxious", "stressed", "hopelessness", "confused"].includes(analysis.emotion) && analysis.confidence >= 30) {
        // Show floating thought bubble only
        const bubbleMsg = getSmartThoughtBubble(newEntry.fullText, selectedMood);
        setThoughtBubble(bubbleMsg);
        setShowBubble(true);
        setTimeout(() => setShowBubble(false), 6000);
      }
      // Streak and points logic
      if (!isToday(lastEntryDate)) {
        addPoints(25, 'Journal entry saved');
        toast({
          title: 'Journal Entry Saved! 🎉',
          description: 'You earned 25 points for your streak.',
        });
        // Update streak
        if (isYesterday(lastEntryDate)) {
          setStreak(s => s + 1);
        } else {
          setStreak(1);
        }
        setLastEntryDate(now.toISOString());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-green-50">
      <Navigation />
      {/* Full Entry Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => { setSelectedEntry(null); setIsEditing(false); setShowDeleteConfirm(false); }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl">{selectedEntry.mood?.emoji}</span>
              <div>
                <div className="text-sm text-gray-500">{selectedEntry.date}</div>
                <div className="text-xs text-gray-400">{selectedEntry.wordCount} words</div>
              </div>
            </div>
            {isEditing ? (
              <>
                <textarea
                  className="w-full min-h-[150px] border rounded-xl p-2 mb-4"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">Cancel</Button>
                  <Button
                    onClick={() => {
                      // Save edit
                      setEntries(entries => entries.map(e =>
                        e.id === selectedEntry.id
                          ? { ...e, preview: editText.substring(0, 100) + (editText.length > 100 ? "..." : ""), fullText: editText, wordCount: editText.split(' ').filter(w => w.length > 0).length }
                          : e
                      ));
                      setSelectedEntry(sel => sel ? { ...sel, fullText: editText, preview: editText.substring(0, 100) + (editText.length > 100 ? "..." : ""), wordCount: editText.split(' ').filter(w => w.length > 0).length } : null);
                      setIsEditing(false);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 rounded-full"
                    disabled={!editText.trim()}
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-lg text-gray-800 whitespace-pre-line mb-4">
                  {selectedEntry.fullText || selectedEntry.preview}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setIsEditing(true); setEditText(selectedEntry.fullText || selectedEntry.preview); }} className="rounded-full">Edit</Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-full"
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl text-center relative">
                  <div className="text-3xl mb-2">⚠️</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Entry?</h3>
                  <p className="text-gray-600 mb-4">Are you sure you want to delete this journal entry? This action cannot be undone.</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-full">Cancel</Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setEntries(entries => entries.filter(e => e.id !== selectedEntry.id));
                        setSelectedEntry(null);
                        setIsEditing(false);
                        setShowDeleteConfirm(false);
                      }}
                      className="rounded-full"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Sage Bubble (bottom left) */}
      {showBubble && thoughtBubble && (
        <SageBubble message={thoughtBubble} onClose={() => setShowBubble(false)} />
      )}
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Your Private Journal ✍️
            </h1>
            <div className="flex justify-center items-center gap-2 mb-2">
              <span className="text-lg">🔥</span>
              <span className="text-lg font-semibold text-purple-700">Streak: {streak} day{streak === 1 ? '' : 's'}</span>
            </div>
            <p className="text-lg text-gray-600">
              A safe space for your thoughts, feelings, and reflections
            </p>
          </div>

          {/* New Entry Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              How are you feeling today?
            </h2>
            {/* Mood Picker */}
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 mr-2">Mood:</span>
              {moodOptions.map(mood => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                  className={`text-2xl px-2 py-1 rounded-full border transition-all focus:outline-none ${selectedMood === mood.label ? 'bg-purple-200 border-purple-500 scale-110' : 'bg-white border-gray-300 hover:bg-purple-100'}`}
                  title={mood.label}
                  type="button"
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
            
            {/* Writing Prompts */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                💡 Need inspiration? Try one of these prompts:
              </p>
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentEntry(prompt + "\n\n")}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full transition-colors duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-4">
            <Textarea
                ref={textareaRef}
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder={moodPlaceholder}
                className="min-h-[200px] border-gray-200 rounded-2xl text-gray-700 resize-none pr-12" // add padding for mic
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`absolute bottom-4 right-4 bg-purple-500 text-white rounded-full p-3 shadow-lg transition-all duration-200 focus:outline-none border-2 border-white ${isListening ? 'animate-pulse bg-pink-500' : 'hover:bg-purple-600'}`}
                title={isListening ? 'Listening...' : 'Start voice input'}
                aria-label="Speech to text"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v1.5m0 0h3m-3 0H9m6-7.5a3 3 0 11-6 0v-3a3 3 0 116 0v3z" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {currentEntry.split(' ').filter(word => word.length > 0).length} words
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentEntry("")}
                  className="rounded-full"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSaveEntry}
                  disabled={!currentEntry.trim()}
                  className="bg-pink-500 hover:bg-pink-600 rounded-full"
                >
                  Save Entry (+25 pts)
                </Button>
              </div>
            </div>
          </div>

          {/* Previous Entries */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Your Journey So Far 📖
            </h2>
            <div className="space-y-4">
              {paginatedEntries.map((entry) => {
                let emoji = entry.mood?.emoji;
                let label = entry.mood?.label;
                if (!emoji && typeof entry.mood === 'string') {
                  // Old entries: mood is just emoji, try to find label
                  const found = moodOptions.find(m => m.emoji === entry.mood);
                  emoji = entry.mood;
                  label = found?.label || '';
                }
                if (!emoji && label) {
                  // If only label is present
                  emoji = (moodOptions.find(m => m.label === label) || moodOptions[3]).emoji;
                }
                return (
                <div
                  key={entry.id}
                  className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:scale-102 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedEntry({ ...entry, fullText: entry.fullText || entry.preview })}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{emoji}</span>
                      <div>
                        <div className="text-sm text-gray-500">{entry.date}</div>
                        <div className="text-xs text-gray-400">{entry.wordCount} words</div>
                      </div>
                    </div>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={e => { e.stopPropagation(); setSelectedEntry({ ...entry, fullText: entry.fullText || entry.preview }); }}
                      >
                      <span className="text-lg">📖</span>
                    </button>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {entry.preview}
                  </p>
                </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded-full text-sm font-semibold border transition-all ${currentPage === page ? 'bg-purple-500 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-100'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Motivational Section */}
          <div className="mt-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-3xl p-8 text-center shadow-xl border border-white/20">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Your Words Have Power
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every entry is a step toward understanding yourself better. Your thoughts matter, 
              your feelings are valid, and your journey is important. Keep writing, keep growing. 💚
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
