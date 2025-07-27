import React, { useState, useEffect, useRef } from 'react';
import { Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  chats: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }>;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
}

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

const chatVariants = {
  initial: (isNew) =>
    isNew
      ? { opacity: 1, scale: 1, x: 0 } // No entrance animation for new chats
      : { opacity: 0, scale: 0.95, x: 20 }, // fallback for others
  animate: { opacity: 1, scale: 1, x: 0 },
  exit: { opacity: 0, scale: 0.85, x: -30, transition: { duration: 0.5 } },
};

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newChatId, setNewChatId] = useState<string | null>(null);
  const [orphanedChat, setOrphanedChat] = useState<any | null>(null);
  const orphanTimeout = useRef<NodeJS.Timeout | null>(null);

  // Wrap onNewChat to track the new chat id
  const handleNewChat = () => {
    onNewChat();
    if (chats.length > 0) {
      setNewChatId(chats[0].id);
    }
  };

  // Custom delete handler to orphan the last chat for animation
  const handleDeleteChat = (id: string) => {
    if (chats.length === 1) {
      setOrphanedChat(chats[0]);
      onDeleteChat(id);
      // Remove orphan after animation
      if (orphanTimeout.current) clearTimeout(orphanTimeout.current);
      orphanTimeout.current = setTimeout(() => setOrphanedChat(null), 500);
    } else {
      onDeleteChat(id);
    }
  };

  useEffect(() => {
    if (newChatId) {
      const timeout = setTimeout(() => setNewChatId(null), 500);
      return () => clearTimeout(timeout);
    }
    return () => {
      if (orphanTimeout.current) clearTimeout(orphanTimeout.current);
    };
  }, [newChatId]);

  return (
    <aside className="w-60 bg-white/80 border-r h-full flex flex-col shadow-lg rounded-tl-3xl rounded-bl-3xl">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <span className="font-bold text-lg text-gray-800">Chats</span>
        <button
          className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-4 py-1 font-semibold shadow"
          onClick={handleNewChat}
        >
          + New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        <AnimatePresence mode="wait">
          {/* Orphaned last chat for exit animation (only render this container when it's the only thing left) */}
          {chats.length === 0 && orphanedChat && (
            <motion.ul
              key="orphan"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <motion.li
                key={orphanedChat.id}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={chatVariants}
                layout
                className={`group flex items-center px-4 py-3 cursor-pointer transition-colors hover:bg-gray-100`}
              >
                <span
                  className="flex-1 truncate font-medium text-gray-800 mr-2"
                  title={orphanedChat.title || 'Untitled Chat'}
                >
                  {orphanedChat.title || <span className="italic text-gray-400">Untitled Chat</span>}
                </span>
                <span className="text-xs text-gray-500 mr-2" title={orphanedChat.updatedAt}>
                  {formatTimestamp(orphanedChat.updatedAt)}
                </span>
                <button
                  className="text-black hover:text-red-500 ml-1"
                  title="Delete chat"
                  style={{ pointerEvents: 'none', opacity: 0.5 }}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </motion.li>
            </motion.ul>
          )}
          {chats.length === 0 && !orphanedChat && (
            <motion.ul
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <li className="w-full text-center text-gray-400">No chats yet</li>
            </motion.ul>
          )}
          {chats.length > 0 && (
            <motion.ul
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence initial={false}>
                {chats.map(chat => (
                  <motion.li
                    key={chat.id}
                    custom={chat.id === newChatId}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={chatVariants}
                    layout
                    className={`group flex items-center px-4 py-3 cursor-pointer transition-colors ${
                      chat.id === activeChatId ? 'bg-gradient-to-r from-purple-100 to-green-100' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    {editingId === chat.id ? (
                      <input
                        className="flex-1 rounded-full bg-white/80 border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all mr-2"
                        value={editValue}
                        autoFocus
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => {
                          onRenameChat(chat.id, editValue.trim() || chat.title);
                          setEditingId(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            onRenameChat(chat.id, editValue.trim() || chat.title);
                            setEditingId(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                      />
                    ) : (
                      <>
                        <span
                          className="flex-1 truncate font-medium text-gray-800 mr-2"
                          title={chat.title || 'Untitled Chat'}
                          onDoubleClick={e => {
                            e.stopPropagation();
                            setEditingId(chat.id);
                            setEditValue(chat.title);
                          }}
                        >
                          {chat.title || <span className="italic text-gray-400">Untitled Chat</span>}
                        </span>
                        <span className="text-xs text-gray-500 mr-2" title={chat.updatedAt}>
                          {formatTimestamp(chat.updatedAt)}
                        </span>
                        <button
                          className="text-black hover:text-red-500 ml-1"
                          title="Delete chat"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default Sidebar; 