import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, AlertTriangle, Trash2, Download } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatboxProps {
  isOpen: boolean;
  onClose: () => void;
  fullWidth?: boolean;
}

const GROQ_MODELS = [
  { value: 'llama3-70b-8192', label: 'Llama 3 70B (Best Overall)' },
  { value: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill Llama 70B (Math/Reasoning)' },
  { value: 'qwen-2.5-32b', label: 'Qwen-2.5-32B (Large Context)' },
  { value: 'llama3-8b-8192', label: 'Llama 3 8B (Lightweight)' },
];

const getHistoryKey = (model: string) => `chat_history_${model}`;

const Chatbox: React.FC<ChatboxProps> = ({ isOpen, onClose, fullWidth }) => {
  const [selectedModel, setSelectedModel] = useState(GROQ_MODELS[0].value);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on model change
  useEffect(() => {
    const saved = localStorage.getItem(getHistoryKey(selectedModel));
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your AI portfolio assistant. I can help you with stock analysis, portfolio insights, and investment strategies. What would you like to know?",
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, [selectedModel]);

  // Save chat history to localStorage on messages change
  useEffect(() => {
    localStorage.setItem(getHistoryKey(selectedModel), JSON.stringify(messages));
  }, [messages, selectedModel]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    setError(null);

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text, model: selectedModel }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse: Message = {
        id: Date.now() + 1,
        text: data.response || 'Sorry, I could not process your request.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      setError('Sorry, there was a problem contacting the AI assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat history for current model
  const clearHistory = () => {
    localStorage.removeItem(getHistoryKey(selectedModel));
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI portfolio assistant. I can help you with stock analysis, portfolio insights, and investment strategies. What would you like to know?",
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  };

  // Export chat as .txt file
  const exportChat = () => {
    const lines = messages.map(m => {
      const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '';
      return `[${time}] ${m.sender === 'user' ? 'You' : 'AI'}: ${m.text}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${selectedModel}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className={`bg-white rounded-lg shadow h-full flex flex-col ${fullWidth ? 'w-full max-w-full' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">AI Portfolio Assistant</h3>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select AI model"
            >
              {GROQ_MODELS.map(model => (
                <option key={model.value} value={model.value}>{model.label}</option>
              ))}
            </select>
            <button
              onClick={exportChat}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Export chat"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={clearHistory}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Ask me about stocks, markets, or your portfolio</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'ai' && (
                  <Bot className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {message.sender === 'user' && (
                  <User className="w-4 h-4 text-blue-100 mt-0.5 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-100 text-red-800 max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about stocks, markets, or your portfolio..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-40"
            rows={2}
            disabled={isLoading}
            style={{ overflow: 'hidden' }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default Chatbox;
