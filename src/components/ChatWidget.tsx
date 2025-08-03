import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string; time: string }[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: { from: 'user'; text: string; time: string } = { from: 'user', text: input.trim(), time };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    // Simulate bot response
    setTimeout(() => {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const botMsg: { from: 'bot'; text: string; time: string } = { from: 'bot', text: '¡Gracias por tu mensaje! Te responderemos pronto.', time: botTime };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-72 h-80 flex flex-col bg-white rounded-lg shadow-xl overflow-hidden mb-2"
          >
            <div className="flex justify-between items-center bg-sky-600 text-white px-4 py-2">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                <span className="font-semibold">Chat en línea</span>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto bg-slate-100 flex flex-col">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 px-3 py-2 max-w-[80%] break-words rounded-lg self-${m.from === 'user' ? 'end bg-sky-200' : 'start bg-white shadow-sm'}`}
                >
                  <p className="text-sm text-gray-800">{m.text}</p>
                  <span className="block text-[10px] text-gray-500 text-right mt-1">{m.time}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="flex p-2 border-t border-gray-200 bg-white">
              <input
                className="flex-1 px-3 py-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800"
                type="text"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-r-lg flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-full shadow-lg"
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
