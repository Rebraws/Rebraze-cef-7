
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Paperclip, Mic, MessageSquare, X } from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  handleSend: (input: string) => void;
  selectedFileCount: number;
  isAiTyping: boolean;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, handleSend, selectedFileCount, isAiTyping, onClose }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = () => {
    handleSend(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full bg-[#FDFBF7]">
      {onClose && (
        <div className="sticky top-0 z-10 flex justify-end p-4 bg-[#FDFBF7]/90 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            title="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 opacity-40">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <p className="font-serif text-2xl text-gray-400">Start a conversation</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth w-full max-w-3xl mx-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
             {msg.sender === 'ai' && (
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-md ring-2 ring-white">
                 <Sparkles size={14} />
               </div>
             )}
             
             <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
               <div className={`
                 inline-block p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm
                 ${msg.sender === 'user' 
                   ? 'bg-[#222] text-white rounded-tr-sm' 
                   : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                 }
               `}>
                 {msg.isLoading ? (
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                 ) : msg.text}
               </div>
               <div className="text-[10px] text-gray-400 font-bold px-1 uppercase tracking-wide opacity-60">
                 {msg.sender === 'ai' ? 'Rebraze AI' : 'You'} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </div>
             </div>
             
             {msg.sender === 'user' && (
               <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 mt-1 ring-2 ring-white shadow-sm">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
               </div>
             )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent">
        <div className={`
           max-w-3xl mx-auto bg-white border border-gray-200 rounded-[26px] shadow-xl shadow-gray-200/50 p-1.5 flex flex-col gap-2 transition-all
           focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-300
        `}>
           <textarea 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => {
               if(e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 onSend();
               }
             }}
             placeholder={selectedFileCount > 0 ? `Ask about ${selectedFileCount} selected sources...` : "Ask a question..."}
             className="w-full max-h-32 min-h-[50px] py-3 px-4 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 text-[15px]"
             disabled={isAiTyping}
           />
           
           <div className="flex items-center justify-between px-2 pb-1">
             <div className="flex items-center gap-1">
               <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Attach file">
                 <Paperclip size={18} />
               </button>
               <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Voice input">
                 <Mic size={18} />
               </button>
             </div>
             <div className="flex items-center gap-3">
               <button 
                 onClick={onSend}
                 disabled={!input.trim() || isAiTyping}
                 className={`
                   p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2
                   ${input.trim() && !isAiTyping
                     ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:scale-105' 
                     : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                   }
                 `}
               >
                 <Send size={16} fill={input.trim() && !isAiTyping ? "currentColor" : "none"} />
                 {input.trim() && !isAiTyping && <span className="text-xs font-bold pr-1">Send</span>}
               </button>
             </div>
           </div>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">
          AI can make mistakes. Please review generated responses.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
