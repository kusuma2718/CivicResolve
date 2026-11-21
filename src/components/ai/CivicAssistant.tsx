import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AIService, AssistantResult } from '../../services/aiService';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedCategory?: string;
  suggestedAction?: string;
  isError?: boolean;
}

export const CivicAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfigNotice, setHasConfigNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: 'Namaste! I am CivicSathi, your AI civic assistant powered by Google Gemini. How can I assist you with reporting or tracking civic issues today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: 'How to report a pothole?', text: 'How do I report a severe pothole on my street?' },
    { label: 'Track complaint status', text: 'How can I track the resolution status of my filed complaint?' },
    { label: 'Water supply issue department', text: 'Which municipal department handles water supply contamination?' },
    { label: 'What is a Critical priority?', text: 'What civic hazards qualify for Critical emergency priority?' },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const activeLanguage = i18n.language || 'en';
      const result = await AIService.askAssistant(
        text,
        { currentPath: window.location.pathname },
        activeLanguage
      );

      if (result.error) {
        if (!result.error.isConfigured || result.error.statusCode === 503) {
          setHasConfigNotice(true);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text:
              result.error?.statusCode === 503
                ? 'Gemini AI assistant requires a GEMINI_API_KEY configured in server/.env. You can still use the CivicResolve portal to submit and track issues manually.'
                : `AI Assistant Error: ${result.error?.message || 'Unable to connect to assistant.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isError: true,
          },
        ]);
      } else if (result.data) {
        const assistantData: AssistantResult = result.data;
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: assistantData.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedCategory: assistantData.suggestedCategory,
            suggestedAction: assistantData.suggestedAction,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: 'An unexpected error occurred while communicating with CivicSathi.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action?: string, category?: string) => {
    if (action === 'report_issue' || category) {
      setIsOpen(false);
      navigate('/report');
    } else if (action === 'track_complaint') {
      setIsOpen(false);
      navigate('/track');
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-navy-900 px-4 py-3 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-blue-400/40"
          aria-label="Open CivicSathi AI Assistant"
        >
          <div className="relative flex h-6 w-6 items-center justify-center">
            <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
          </div>
          <span className="font-semibold text-sm tracking-wide">CivicSathi AI</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Slide-in / Popup Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[92vw] max-w-sm sm:max-w-md h-[550px] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-navy-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-navy-950 via-navy-900 to-blue-900 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">CivicSathi</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/80">Civic Guidance & Triage Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close Assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Config notification if key is missing */}
          {hasConfigNotice && (
            <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                <span>Backend requires GEMINI_API_KEY in server/.env</span>
              </div>
              <button
                type="button"
                onClick={() => setHasConfigNotice(false)}
                className="text-amber-700 hover:text-amber-950 text-[10px] font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 shadow-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : msg.isError
                      ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-xs'
                      : 'bg-white border border-slate-200 text-navy-950 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Suggestion Card inside Assistant message */}
                  {(msg.suggestedCategory || msg.suggestedAction) && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {msg.suggestedCategory && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {msg.suggestedCategory}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleActionClick(msg.suggestedAction, msg.suggestedCategory)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-auto"
                      >
                        Proceed <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <span
                    className={`block mt-1 text-[9px] ${
                      msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
                {msg.sender === 'user' && (
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-800 text-white shadow-xs mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 p-2.5 shadow-xs flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  <span className="text-slate-500 text-xs">CivicSathi is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (if fewer than 4 messages) */}
          {messages.length <= 3 && !isLoading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  className="whitespace-nowrap rounded-full border border-blue-200 bg-blue-50/50 px-2.5 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="border-t border-slate-200 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about civic issues, categories, or tracking..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Powered by Gemini AI (Backend Triage)</span>
              <span>Lang: {i18n.language.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
