import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { ChatMessage } from '../../types';
import { generateChatResponse } from '../../services/geminiService';

interface GlobalAiPanelProps {
  isAiOpen: boolean;
  setIsAiOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GlobalAiPanel: React.FC<GlobalAiPanelProps> = ({ isAiOpen, setIsAiOpen }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: `Hello! I'm Rebraze AI. How can I help you today?`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: input, 
      timestamp: new Date() 
    };
    
    setInput('');
    
    const aiLoadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: '...',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, aiLoadingMessage]);
    setIsAiTyping(true);

    const aiResponseText = await generateChatResponse(input, messages);

    const aiResponseMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponseText,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev.slice(0, -1), aiResponseMessage]);
    setIsAiTyping(false);
  };

  return (
    <div className={`fixed top-0 right-0 h-full bg-[#FDFBF7] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 ${isAiOpen ? 'translate-x-0' : 'translate-x-full'} w-full md:w-[420px] flex flex-col border-l border-gray-100`}>
      <div className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-orange-100">
            <Sparkles size={18} fill="white" />
          </div>
          <h3 className="font-bold text-gray-800 text-sm">Rebraze AI</h3>
        </div>
        <button onClick={() => setIsAiOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
             {msg.sender === 'ai' && (
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm ring-2 ring-white">
                 <Sparkles size={14} />
               </div>
             )}
             
             <div className={`max-w-[85%] space-y-1.5 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
               <div className={`
                 inline-block p-3 rounded-lg text-sm leading-relaxed shadow-sm
                 ${msg.sender === 'user' 
                   ? 'bg-[#222] text-white rounded-br-none' 
                   : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                 }
               `}>
                 {msg.isLoading ? (
                    <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                 ) : msg.text}
               </div>
             </div>
             
             {msg.sender === 'user' && (
               <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 mt-1 ring-2 ring-white shadow-sm">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
               </div>
             )}
          </div>
        ))}
         <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-gradient-to-t from-white via-white/80 to-transparent shrink-0">
         <div className="relative">
           <textarea 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => {
               if(e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSend();
               }
             }}
             placeholder="Ask anything..."
             className="w-full max-h-24 min-h-[48px] p-3 pr-12 bg-white border border-gray-200 rounded-xl resize-none outline-none text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
             disabled={isAiTyping}
           />
           <button 
             onClick={handleSend}
             disabled={!input.trim() || isAiTyping}
             className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors
               ${input.trim() && !isAiTyping
                 ? 'bg-orange-500 text-white hover:bg-orange-600' 
                 : 'bg-gray-100 text-gray-300 cursor-not-allowed'
               }
             `}
            >
              <Send size={16} />
           </button>
         </div>
       </div>
    </div>
  );
};

export default GlobalAiPanel;