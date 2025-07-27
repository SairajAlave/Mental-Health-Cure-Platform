
import { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, User, UserCheck, Settings } from "lucide-react";
import { useVoiceInteraction } from "@/hooks/useVoiceInteraction";
import { analyzeEmotion, generateEmpatheticResponse } from "@/utils/emotionAnalysis";
import Sentiment from 'sentiment';
import AvatarTalking from "@/components/AvatarTalking";
import TypingAnimation from "@/components/TypingAnimation";
import { Canvas } from '@react-three/fiber';
import { ThreeDExperience } from '@/components/ThreeDExperience';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '@/components/Sidebar';

// Intent detection helper
function detectIntent(input: string) {
  const lower = input.toLowerCase();
  if (/i feel|i'm tired|i'm sad|i'm angry|i'm upset|i'm anxious|i'm stressed/.test(lower)) return "venting";
  if (/can you help|could you|would you|\?$/.test(lower)) return "question";
  if (/i'm happy|i had a great|i'm excited|i'm grateful|good news/.test(lower)) return "sharing_good";
  return "neutral";
}

// Clean text for TTS by removing emojis, asterisks, and formatting
function cleanForTTS(text: string): string {
  // Remove emojis
  const noEmojis = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
  // Remove asterisks and markdown-like formatting
  const noAsterisks = noEmojis.replace(/\*+/g, '');
  // Remove leading/trailing whitespace and extra spaces
  return noAsterisks.replace(/\s+/g, ' ').trim();
}

// Empathetic reply logic
function getEmpatheticReply(mood: string, intent: string) {
  if (mood === 'negative' && intent === 'venting') {
    return "I'm really sorry you're feeling this way. Want to talk about what's been hardest today?";
  }
  if (mood === 'positive') {
    return "That's amazing to hear! Would you like to reflect on what made your day good?";
  }
  if (intent === 'question') {
    return "I'm here to help! What would you like to know?";
  }
  return "I'm here for you. Tell me more if you'd like.";
}

// Chat session type
interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{ role: 'user' | 'assistant', content: string, time: string }>;
  isTyping?: boolean;
  streamingReply?: string;
}

// Helper to format date for sidebar
function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString();
}

// Helper: Sage's greeting message
const sageGreeting = {
  role: 'assistant' as const,
  content: "Hello, friend! 🌸 I'm here to listen and support you. How are you feeling today? You can type or use the microphone to talk to me.",
  time: 'Just now',
};

const AICompanion = () => {
  const placeholders = [
    "Share what's on your mind... I'm here to listen 💚",
    "How are you feeling today?",
    "Sage is listening...",
    "It's okay to just type one word 💬",
    "What's been on your mind lately?",
    "I'm here whenever you need to talk 🌸"
  ];
  
  // Custom CSS for enhanced animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gentlePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      
      @keyframes audioWave {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.5); }
      }
      
      .mic-active {
        animation: gentlePulse 2s ease-in-out infinite;
      }
      
      .speaking-active {
        animation: audioWave 1s ease-in-out infinite;
      }
      
      .glassmorphic-input {
        background: rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      }
      
      .glassmorphic-input:focus {
        border: 1px solid #a682ff;
        box-shadow: 0 0 20px rgba(166, 130, 255, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [placeholders.length]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hello, friend! 🌸 I'm here to listen and support you. How are you feeling today? You can type or use the microphone to talk to me.",
      time: "Just now"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const navigate = useNavigate();

  // Multi-chat state
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sage-chats');
    console.log('[DEBUG] On mount, localStorage sage-chats:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let loadedChats = parsed.chats || [];
        // Convert any leftover streamingReply into a message
        let needsUpdate = false;
        loadedChats = loadedChats.map(chat => {
          if (chat.streamingReply && chat.streamingReply.trim()) {
            needsUpdate = true;
            return {
              ...chat,
              isTyping: false,
              streamingReply: '',
              messages: [
                ...chat.messages,
                { role: 'assistant', content: chat.streamingReply.trim(), time: 'Just now' }
              ]
            };
          }
          return chat;
        });
        setChats(loadedChats);
        setActiveChatId(parsed.lastActiveId || (loadedChats?.[0]?.id ?? null));
        // Persist cleaned chats if any were updated
        if (needsUpdate) {
          localStorage.setItem('sage-chats', JSON.stringify({ chats: loadedChats, lastActiveId: parsed.lastActiveId }));
        }
      } catch {}
    } else {
      // If no chats, create a new one
      const newChat: ChatSession = {
        id: uuidv4(),
        title: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            role: 'assistant',
            content: "Hello, friend! 🌸 I'm here to listen and support you. How are you feeling today? You can type or use the microphone to talk to me.",
            time: 'Just now',
          },
        ],
      };
      setChats([newChat]);
      setActiveChatId(newChat.id);
    }
  }, []);

  // Save chats to localStorage whenever chats or activeChatId change
  useEffect(() => {
    // Before saving, ensure any streamingReply is saved as a message if isTyping is false or streamingReply is not empty
    const chatsToSave = chats.map(chat => {
      if (chat.streamingReply && chat.streamingReply.trim() && !chat.isTyping) {
        // If streamingReply exists and not typing, save as a message
        return {
          ...chat,
          messages: [
            ...chat.messages,
            { role: 'assistant', content: chat.streamingReply.trim(), time: 'Just now' }
          ],
          streamingReply: '',
        };
      }
      return chat;
    });
    localStorage.setItem('sage-chats', JSON.stringify({ chats: chatsToSave, lastActiveId: activeChatId }));
  }, [chats, activeChatId]);

  // Flush chat state to localStorage on page unload or tab hide
  useEffect(() => {
    const flushChats = () => {
      const chatsToSave = chats.map(chat => {
        if (chat.streamingReply && chat.streamingReply.trim()) {
          return {
            ...chat,
            isTyping: false,
            streamingReply: '',
            messages: [
              ...chat.messages,
              { role: 'assistant', content: chat.streamingReply.trim(), time: 'Just now' }
            ]
          };
        }
        return chat;
      });
      localStorage.setItem('sage-chats', JSON.stringify({ chats: chatsToSave, lastActiveId: activeChatId }));
    };
    window.addEventListener('beforeunload', flushChats);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushChats();
    });
    return () => {
      window.removeEventListener('beforeunload', flushChats);
      document.removeEventListener('visibilitychange', flushChats);
    };
  }, [chats, activeChatId]);

  // On mount, if a chat has isTyping true and a non-empty streamingReply, convert that streamingReply into a final assistant message and reset isTyping/streamingReply
  useEffect(() => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.streamingReply && chat.streamingReply.trim()) {
        return {
          ...chat,
          isTyping: false,
          streamingReply: '',
          messages: [
            ...chat.messages,
            { role: 'assistant', content: chat.streamingReply.trim(), time: 'Just now' }
          ]
        };
      }
      return chat;
    }));
  }, []);

  // On mount, check for pendingAIMessage in localStorage and insert it if present
  useEffect(() => {
    const pending = localStorage.getItem('pendingAIMessage');
    if (pending) {
      try {
        const { chatId, content, time } = JSON.parse(pending);
        setChats(prevChats => prevChats.map(chat =>
          chat.id === chatId
            ? { ...chat, isTyping: false, streamingReply: '', messages: [...chat.messages, { role: 'assistant', content, time }] }
            : chat
        ));
        localStorage.removeItem('pendingAIMessage');
      } catch {}
    }
  }, []);

  // Get active chat
  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sage-chat-history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('sage-chat-history', JSON.stringify(messages));
  }, [messages]);

  const handleTranscript = (transcript: string) => {
    // Append transcript to existing input, or set if empty
    setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  const handleSpeakComplete = () => {
    console.log("AI finished speaking");
  };

  const {
    isListening,
    isSpeaking,
    voiceGender,
    availableVoices,
    selectedVoice,
    voiceProfiles,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleVoiceGender,
    setVoiceProfile,
    setSelectedVoice
  } = useVoiceInteraction({
    onTranscript: handleTranscript,
    onSpeakComplete: handleSpeakComplete
  });

  const quickResponses = [
    "I'm feeling anxious",
    "I had a good day",
    "I'm stressed about work",
    "I feel lonely",
    "I'm grateful today",
    "I need encouragement"
  ];

  // Remove global isTyping and streamingReply
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Send message handler for active chat
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim()) return;

    if (!chats.length) {
      // Create a new chat session on first message
      const newChat: ChatSession = {
        id: uuidv4(),
        title: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [sageGreeting],
      };
      setChats([newChat]);
      setActiveChatId(newChat.id);
      // Wait for state to update, then continue
      setTimeout(() => {
        sendMessageToChat(newChat.id, textToSend);
      }, 0);
      setInputMessage("");
      setChats(prev => prev.map(chat =>
        chat.id === newChat.id
          ? { ...chat, streamingReply: "", isTyping: false }
          : chat
      ));
      return;
    }
    sendMessageToChat(activeChatId!, textToSend);
  };

  // Helper to send a message to a chat by id
  const sendMessageToChat = async (chatId: string, textToSend: string) => {
    const userMsg: { role: 'user'; content: string; time: string } = {
      role: 'user',
      content: textToSend,
      time: 'Just now',
    };
    setInputMessage("");
    setChats(prev => {
      const updated = prev.map(chat =>
        chat.id === chatId
          ? { ...chat, isTyping: true, streamingReply: "", messages: [...chat.messages, userMsg] as { role: 'user' | 'assistant'; content: string; time: string }[], updatedAt: new Date().toISOString(), title: chat.title || textToSend }
          : chat
      );
      // Move the updated chat to the top
      const idx = updated.findIndex(chat => chat.id === chatId);
      if (idx > 0) {
        const [chatToTop] = updated.splice(idx, 1);
        updated.unshift(chatToTop);
      }
      return updated;
    });
    try {
      // Prepare history: last 9 previous messages (role/content), plus the current user message
      const chat = chats.find(c => c.id === chatId);
      let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      if (chat) {
        // Take last 9 messages (excluding the one we're about to send)
        const prevHistory = chat.messages.slice(-9).map(m => ({ role: m.role, content: m.content }));
        history = [...prevHistory, { role: 'user', content: textToSend }];
      } else {
        history = [{ role: 'user', content: textToSend }];
      }
      const res = await fetch('http://127.0.0.1:5005/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history })
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";
      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, streamingReply: (chat.streamingReply || "") + chunk }
            : chat
        ));
      }
      console.log("AI response received:", fullText);
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, isTyping: false }
          : chat
      ));
      const aiMsg: { role: 'assistant'; content: string; time: string } = {
        role: 'assistant',
        content: fullText.trim() || "I'm here for you.",
        time: 'Just now',
      };
      // Save to pendingAIMessage in localStorage immediately
      localStorage.setItem('pendingAIMessage', JSON.stringify({ chatId, content: aiMsg.content, time: aiMsg.time }));
      // Immediately add the AI message to chat state and persist it
      setChats(prev => {
        const updated = prev.map(chat =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, aiMsg] as { role: 'user' | 'assistant'; content: string; time: string }[], updatedAt: new Date().toISOString(), streamingReply: '' }
            : chat
        );
        const idx = updated.findIndex(chat => chat.id === chatId);
        if (idx > 0) {
          const [chatToTop] = updated.splice(idx, 1);
          updated.unshift(chatToTop);
        }
        // Directly persist to localStorage immediately
        localStorage.setItem('sage-chats', JSON.stringify({ chats: updated, lastActiveId: activeChatId }));
        // Remove pendingAIMessage after adding to state
        localStorage.removeItem('pendingAIMessage');
        return updated;
      });
      // Now trigger TTS (do not wait for TTS to update chat)
      console.log("TTS starting...");
      if (voiceEnabled && !isSpeaking) {
        const cleanedText = cleanForTTS(fullText.trim());
        speak(cleanedText);
      }
    } catch (err) {
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, isTyping: false, streamingReply: "" }
          : chat
      ));
      const aiMsg: { role: 'assistant'; content: string; time: string } = {
        role: 'assistant',
        content: "Sorry, I couldn't connect to my brain right now. Please try again soon!",
        time: 'Just now',
      };
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, aiMsg] as { role: 'user' | 'assistant'; content: string; time: string }[], updatedAt: new Date().toISOString() }
          : chat
      ));
    }
  };

  // New chat handler
  const createNewChat = () => {
    const newChat: ChatSession = {
      id: uuidv4(),
      title: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          role: 'assistant',
          content: "Hello, friend! 🌸 I'm here to listen and support you. How are you feeling today? You can type or use the microphone to talk to me.",
          time: 'Just now',
        },
      ],
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInputMessage("");
    setChats(prev => prev.map(chat =>
      chat.id === newChat.id
        ? { ...chat, streamingReply: "", isTyping: false }
        : chat
    ));
  };

  // Delete chat handler
  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    if (activeChatId === id) {
      // Switch to another chat if deleting current
      const remaining = chats.filter(chat => chat.id !== id);
      setActiveChatId(remaining[0]?.id || null);
      }
  };

  // Rename chat handler
  const renameChat = (id: string, newTitle: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === id ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() } : chat
    ));
  };

  const handleQuickResponse = (response: string) => {
    setInputMessage(response);
  };

  const toggleVoiceListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeChat?.messages && activeChat.messages.length > 1 && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeChat?.messages?.length]);

  return (
    <div className="min-h-screen h-full bg-gradient-to-br from-purple-50 via-pink-50 to-green-50">
      <Navigation />
      <div className="pt-20 pb-8 px-4 h-full">
        {/* Header above chat+sidebar card */}
        <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              AI Companion 🤖
            </h1>
            <p className="text-lg text-gray-600">
              Always here to listen, understand, and support you
            </p>
            <div className="flex justify-center items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mic className="w-4 h-4" />
                <span>Voice Input: {isListening ? 'Listening...' : 'Ready'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Volume2 className="w-4 h-4" />
                <span>Voice Output: {voiceEnabled ? 'On' : 'Off'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {voiceGender === 'female' ? <UserCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span>Voice: {voiceGender === 'female' ? 'Female' : 'Male'}</span>
              </div>
            </div>
          </div>
        {/* Chat+Sidebar card */}
        <div className="max-w-4xl mx-auto flex w-full rounded-3xl shadow-xl bg-white/60 backdrop-blur-sm border border-white/20 h-[88vh] min-h-[650px] items-stretch">
          {/* Sidebar */}
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={setActiveChatId}
            onNewChat={createNewChat}
            onDeleteChat={deleteChat}
            onRenameChat={renameChat}
          />
          {/* Chat Area */}
          <div className="flex-1 flex flex-col h-full">
            {/* Chat Header with 3D Mode button */}
            <div className="flex items-center justify-between px-6 py-4 bg-purple-100/60 rounded-tr-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center overflow-hidden">
                  <AvatarTalking 
                    isSpeaking={isSpeaking} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-lg text-gray-800">Sage</div>
                  <div className="text-sm text-gray-500">Your compassionate AI listener</div>
                </div>
                <span className="ml-2 text-green-600 font-semibold text-sm">● Online</span>
              </div>
              <button
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg shadow font-semibold"
                onClick={() => navigate('/virtual-companion')}
              >
                3D Mode
              </button>
            </div>
            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-2 pb-6 space-y-2 flex flex-col"
              ref={chatContainerRef}
            >
              {(!chats.length) ? (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-white/80 text-gray-800 border border-gray-200">
                    <p className="text-sm leading-relaxed">{sageGreeting.content}</p>
                    <div className="text-xs mt-2 text-gray-500">{sageGreeting.time}</div>
                  </div>
                </div>
              ) : (
                activeChat?.messages.map((message, index) => (
                <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                        ? 'bg-pink-500 text-white'
                        : 'bg-white/80 text-gray-800 border border-gray-200'
                    }`}
                  >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-pink-100' : 'text-gray-500'
                    }`}>
                      {message.time}
                    </div>
                  </div>
                </div>
                ))
              )}
              {/* Streaming reply */}
              {activeChat?.isTyping && (
                console.log('[DEBUG] Typing animation triggered for chatId:', activeChatId),
                <div className="flex justify-start mt-2">
                  <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-white/80 text-gray-800 border border-gray-200 flex items-center gap-2">
                    <TypingAnimation />
                  </div>
                </div>
              )}
              {activeChat?.streamingReply && (
                <div className="flex justify-start mt-2">
                  <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-white/80 text-gray-800 border border-gray-200">
                    <span>{activeChat.streamingReply}</span>
                  </div>
                </div>
              )}
            </div>
            {/* Input Area and Listening Indicator - container grows downward */}
            <div className={`w-full flex flex-col relative ${isListening ? 'pb-14' : ''}`}>
              <div className="p-2 border-t border-gray-200 bg-white/60 backdrop-blur-sm rounded-b-3xl flex items-end">
                <div className="flex space-x-4 w-full">
                <div className="flex-1">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full p-4 resize-none h-24 text-sm bg-white/30 backdrop-blur-md rounded-3xl border border-white/20 text-gray-800 transition-all duration-300 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/40 focus:outline-none placeholder:text-gray-500 placeholder:font-normal"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  {/* Row 1: Mic and Mute */}
                  <div className="flex space-x-2">
                  <Button
                    onClick={toggleVoiceListening}
                    variant="outline"
                      className={`rounded-full p-3 w-12 h-12 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      isListening 
                          ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-300 text-red-600 shadow-lg shadow-red-400/40 mic-active' 
                          : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-600 hover:shadow-blue-400/40'
                    }`}
                    disabled={isSpeaking}
                      title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={toggleVoiceOutput}
                    variant="outline"
                      className={`rounded-full p-3 w-12 h-12 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      voiceEnabled 
                          ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 text-green-600 hover:shadow-green-400/40' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 text-gray-600 hover:shadow-gray-400/40'
                      }`}
                      title={voiceEnabled ? "Disable voice output" : "Enable voice output"}
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                  </div>
                  {/* Row 2: Settings and Send */}
                  <div className="flex space-x-2">
                  <Button
                      onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                    variant="outline"
                      className="rounded-full p-3 w-12 h-12 backdrop-blur-md bg-gradient-to-br from-white/80 to-white/60 border-gray-300 text-gray-600 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-gray-400/40 transition-all duration-200"
                      title="Voice Settings"
                    >
                      <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim()}
                      className="rounded-full p-3 w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-200 hover:from-pink-200 hover:to-purple-300 text-purple-600 border border-purple-300/50 shadow-md shadow-purple-400/25 hover:shadow-purple-400/35 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      title="Send message"
                  >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                  </Button>
                    </div>
                  </div>
                </div>
              </div>
              {isListening && (
                <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-full flex justify-center pointer-events-none">
                  <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm font-medium">Listening... Speak now</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Support Resources section OUTSIDE the chat+sidebar card */}
        <div className="max-w-4xl mx-auto mt-8 bg-gradient-to-r from-green-100 to-blue-100 rounded-3xl p-8 text-center shadow-xl border border-white/20">
            <div className="text-4xl mb-4">💚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Remember: You're Not Alone
            </h3>
            <p className="text-gray-600 mb-4">
              While I'm here for emotional support, please reach out to professionals or trusted friends 
              for additional help when needed.
            </p>
            <div className="text-sm text-gray-500">
              🏥 Crisis resources • 👥 Community support • 💊 Professional help
          </div>
        </div>
      </div>
      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md relative">
            <h2 className="text-lg font-bold mb-4">Voice Settings</h2>
            <div className="mb-4">
              <label className="block font-medium mb-2">Voice Gender</label>
              <button
                className={`px-4 py-2 rounded mr-2 ${voiceGender === 'female' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => { if (voiceGender !== 'female') toggleVoiceGender(); }}
              >
                Female
              </button>
              <button
                className={`px-4 py-2 rounded ${voiceGender === 'male' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => { if (voiceGender !== 'male') toggleVoiceGender(); }}
              >
                Male
              </button>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Select Voice</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedVoice?.name || ''}
                onChange={e => {
                  const v = availableVoices.find(v => v.name === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
              >
                {availableVoices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
            <button
              className="mt-4 px-4 py-2 bg-pink-500 text-white rounded"
              onClick={() => setShowVoiceSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* End Voice Settings Modal */}
    </div>
  );
};

export default AICompanion;
