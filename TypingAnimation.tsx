import React from "react";

const TypingAnimation = () => (
  <div className="flex items-center gap-2">
    <span className="text-lg text-purple-500">Sage is typing</span>
    <span className="flex space-x-1">
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
    </span>
  </div>
);

export default TypingAnimation; 