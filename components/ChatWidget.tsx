
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { Car, Message } from '../types';

interface ChatWidgetProps {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  cars: Car[];
  openModal: (car: Car) => void;
  formatCurrency: (val: number) => string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  isChatOpen, setIsChatOpen, cars, openModal, formatCurrency 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou a Alice, consultora especialista da Arena Repasse.\n\nEstou aqui para encontrar a melhor oportunidade para você. O que procura hoje?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const cleanAndParseJSON = (text: string) => {
    try {
      let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const first = clean.indexOf("{");
      const last = clean.lastIndexOf("}");
      if (first !== -1 && last !== -1) {
        clean = clean.substring(first, last + 1);
      }
      return JSON.parse(clean);
    } catch {
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Initialize GoogleGenAI instance right before the API call as per guidelines
    const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const userMsg = inputMessage;
    const newMessages = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      const inventory = cars.map(c => 
        `ID:${c.id} | ${c.make} ${c.model} ${c.year === 32000 ? 'Zero KM' : c.year} | Preço: R$${c.price} | FIPE: R$${c.fipeprice} | Categoria: ${c.category}`
      ).join("\n");

      const systemInstruction = `
VOCÊ É Alice, consultora especialista da Arena Repasse.
ESTOQUE:
${inventory}
REGRAS: Responda apenas JSON { "reply": "...", "car_ids": [] }. Max 200 char no reply.
      `.trim();

      // Using the recommended Google GenAI SDK pattern
      const response: GenerateContentResponse = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          temperature: 0.3,
          systemInstruction: systemInstruction,
        }
      });

      // Extract text directly from the response object
      const generatedText = response.text;
      const parsed = cleanAndParseJSON(generatedText || "");

      if (parsed && parsed.reply) {
        const validIds = Array.isArray(parsed.car_ids)
          ? parsed.car_ids.filter((id: string) => cars.some(c => c.id === id))
          : [];

        setMessages(prev => [
          ...prev,
          { role: "model", text: parsed.reply, recommendedCarIds: validIds }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "model", text: "Interessante! Posso te mostrar as opções que temos nesse perfil?", recommendedCarIds: [] }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "model", text: "Tive um pequeno problema técnico. Pode tentar novamente?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-4 flex flex-col gap-3 z-40">
        <button
          onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
          className="bg-[#25D366] text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center text-2xl"
        >
          <i className="fa-brands fa-whatsapp"></i>
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-brand-red text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:bg-red-800 active:scale-95 transition flex items-center justify-center text-2xl relative border-2 border-brand-orange"
        >
          {isChatOpen ? <i className="fa-solid fa-times"></i> : <i className="fa-solid fa-robot"></i>}
          {!isChatOpen && <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-surface animate-pulse"></span>}
        </button>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 bg-brand-surface rounded-xl shadow-2xl z-40 flex flex-col border border-gray-700 overflow-hidden animate-slide-up" style={{ height: '500px', maxHeight: '70vh' }}>
          
          <div className="bg-gradient-to-r from-brand-darkRed to-black p-4 flex items-center gap-3 border-b border-gray-700 shadow-md">
            <div className="relative">
              <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center text-brand-orange text-lg border-2 border-brand-orange">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm">Alice - Arena Repasse</h4>
              <p className="text-[10px] text-gray-400">Consultora Inteligente</p>
            </div>

            <button onClick={() => setIsChatOpen(false)} className="ml-auto text-gray-400 hover:text-white">
              <i className="fa-solid fa-chevron-down"></i>
            </button>
          </div>

          <div className="flex-1 bg-brand-dark p-4 overflow-y-auto space-y-4 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-orange text-white rounded-br-none shadow-md'
                    : 'bg-brand-surface text-gray-200 border border-gray-700 rounded-bl-none shadow-sm'
                } whitespace-pre-line leading-relaxed`}>
                  {msg.text}
                </div>

                {msg.role === 'model' && msg.recommendedCarIds && msg.recommendedCarIds.length > 0 && (
                  <div className="flex gap-2 w-full overflow-x-auto py-3 no-scrollbar pl-1 mt-1">
                    {msg.recommendedCarIds.map(id => {
                      const car = cars.find(c => c.id === id);
                      if (!car) return null;
                      const fipe = Number(car.fipeprice) || 0;
                      return (
                        <div
                          key={car.id}
                          className="min-w-[200px] w-[200px] bg-brand-surface border border-gray-700 rounded-xl overflow-hidden flex-shrink-0 shadow-lg hover:border-brand-orange transition-all cursor-pointer group"
                          onClick={() => openModal(car)}
                        >
                          <div className="h-28 w-full relative overflow-hidden">
                            <img
                              src={car.image}
                              className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
                              alt={car.model}
                            />
                            {fipe > 0 && (
                              <div className="absolute top-2 right-2 bg-green-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                                -{Math.round(((fipe - car.price) / fipe) * 100)}%
                              </div>
                            )}
                          </div>

                          <div className="p-3">
                            <h5 className="font-bold text-white text-xs truncate mb-1">{car.make} {car.model}</h5>
                            <p className="text-brand-orange font-black text-sm mb-2">{formatCurrency(car.price)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1 text-gray-500 text-xs ml-2 animate-pulse">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          <div className="p-3 bg-brand-surface border-t border-gray-700 flex gap-2 items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Fale com a Alice..."
              className="flex-1 bg-brand-dark border border-gray-700 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange placeholder-gray-500"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={isTyping || !inputMessage.trim()}
              className="bg-brand-orange text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition transform active:scale-90"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
