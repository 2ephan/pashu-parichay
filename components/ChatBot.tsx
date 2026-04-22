import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Namaste! I am your AI veterinary assistant. How can I help you with your cattle or buffalo today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session safely so missing API key does not crash the page.
    try {
      chatSessionRef.current = createChatSession();
    } catch (error: any) {
      setMessages([
        {
          id: 'init-error',
          role: 'model',
          text:
            error?.message ||
            'Gemini is not configured. Add GEMINI_API_KEY in .env.local to enable chat.',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !chatSessionRef.current || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({
        message: userMessage.text
      });
      
      const responseText = result.text;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm sorry, I couldn't generate a response."
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorText = "I apologize, but I'm having trouble connecting right now. Please check your internet connection and try again.";
      
      // Check specifically for Rate Limit/Quota errors
      const errStr = JSON.stringify(error);
      if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
          errorText = "⚠️ Usage Limit Exceeded. The AI service is currently busy due to high traffic. Please wait a minute and try again.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 h-screen flex flex-col">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-grow border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex items-center shadow-sm">
          <div className="p-2 bg-white/20 rounded-lg mr-3">
             <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg flex items-center">
              Pashu Mitra
              <Sparkles className="w-4 h-4 ml-2 text-yellow-300" />
            </h2>
            <p className="text-emerald-100 text-xs">Powered by Gemini 3 Pro</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-950">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-slate-700 dark:bg-slate-600' : 'bg-emerald-600'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-none border border-slate-100 dark:border-slate-700' 
                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 rounded-tl-none border border-emerald-100 dark:border-emerald-800'
              }`}>
                <div className="text-sm">
                   {msg.text.includes("Usage Limit Exceeded") && <AlertCircle className="w-4 h-4 text-orange-500 mr-2 inline-block" />}
                   {/* Use Markdown Renderer here */}
                   <MarkdownRenderer content={msg.text} />
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl rounded-tl-none p-4 border border-emerald-100 dark:border-emerald-800 flex items-center">
                <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin mr-2" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about breed characteristics, diet, or health..."
              className="flex-grow px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 rounded-xl transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};