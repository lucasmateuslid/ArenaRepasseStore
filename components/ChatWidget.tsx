import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
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
    { role: 'model', text: 'Olá! Sou o Caio, consultor especialista da Arena Repasse. \n\nEstou aqui para encontrar a melhor oportunidade de negócio para você. O que você procura hoje? (Ex: Carro pra família, pra trabalho, até 50 mil...)' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Inicializa o cliente do Gemini
  const aiClient = React.useMemo(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || (process as any).env?.API_KEY || '';
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const cleanAndParseJSON = (text: string) => {
    try {
      // 1. Remove marcadores de markdown se a IA insistir em colocar
      let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // 2. Encontra o objeto JSON dentro do texto (caso a IA fale algo antes)
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Erro ao processar resposta da IA:", text);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!aiClient) {
      setMessages(prev => [...prev, { role: 'model', text: 'Erro de configuração: Chave de API não encontrada.' }]);
      return;
    }

    const userMsg = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Cria um índice simplificado para a IA não se perder
      const inventoryList = cars.map(c => 
        `ID:${c.id} | ${c.make} ${c.model} (${c.year}) | R$${c.price} | Detalhes: ${c.description.substring(0, 60)}...`
      ).join('\n');

      const systemPrompt = `
        VOCÊ É: Caio, Consultor da Arena Repasse.
        OBJETIVO: Responder APENAS em JSON válido.

        ESTOQUE DISPONÍVEL:
        ${inventoryList}

        REGRAS RÍGIDAS:
        1. NÃO use Markdown (\`\`\`). Retorne apenas o JSON cru.
        2. Se encontrar carros que batem com o pedido, coloque os IDs em "car_ids".
        3. Se NÃO encontrar, mande "car_ids": [] e explique que não tem no momento.
        4. "reply" deve ser curto e vendedor.

        EXEMPLO DE RESPOSTA (Siga este formato):
        {
          "reply": "Tenho essas opções perfeitas para você:",
          "car_ids": ["123", "456"]
        }
      `;

      const chatSession: Chat = aiClient.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          temperature: 0.2, // Baixa temperatura para ser preciso nos dados
        }
      });
      
      const result: GenerateContentResponse = await chatSession.sendMessage({ 
        message: `${systemPrompt}\n\nPERGUNTA DO CLIENTE: "${userMsg}"` 
      });

      const parsedResponse = cleanAndParseJSON(result.text || '');

      if (parsedResponse && parsedResponse.reply) {
        // Validação extra: Garante que os IDs retornados realmente existem no estoque atual
        const validIds = Array.isArray(parsedResponse.car_ids) 
          ? parsedResponse.car_ids.filter((id: string) => cars.some(c => c.id === id))
          : [];

        setMessages(prev => [...prev, { 
          role: 'model', 
          text: parsedResponse.reply,
          recommendedCarIds: validIds
        }]);
      } else {
        // Fallback real: Se falhar o JSON, pede para repetir
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: "Desculpe, tive um pequeno lapso. Pode repetir o que procura de forma mais direta? (Ex: 'Sedan automático até 60 mil')",
          recommendedCarIds: []
        }]);
      }

    } catch (error) {
      console.error("Erro API:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Estou com instabilidade no sistema. Pode me chamar no WhatsApp?' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-4 flex flex-col gap-3 z-40">
        <button onClick={() => window.open('https://wa.me/5511999999999', '_blank')} className="bg-[#25D366] text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center text-2xl" title="Falar no WhatsApp"><i className="fa-brands fa-whatsapp"></i></button>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="bg-brand-red text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:bg-red-800 active:scale-95 transition flex items-center justify-center text-2xl relative border-2 border-brand-orange">
          {isChatOpen ? <i className="fa-solid fa-times"></i> : <i className="fa-solid fa-robot"></i>}
          {!isChatOpen && <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-surface animate-pulse"></span>}
        </button>
      </div>
      {isChatOpen && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 bg-brand-surface rounded-xl shadow-2xl z-40 flex flex-col border border-gray-700 overflow-hidden animate-slide-up" style={{height: '500px', maxHeight: '70vh'}}>
          <div className="bg-gradient-to-r from-brand-darkRed to-black p-4 flex items-center gap-3 border-b border-gray-700 shadow-md">
            <div className="relative">
              <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center text-brand-orange text-lg border-2 border-brand-orange"><i className="fa-solid fa-user-tie"></i></div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Caio - Arena Repasse</h4>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">Consultor Inteligente</p>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="ml-auto text-gray-400 hover:text-white"><i className="fa-solid fa-chevron-down"></i></button>
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
                        <div key={car.id} className="min-w-[200px] w-[200px] bg-brand-surface border border-gray-700 rounded-xl overflow-hidden flex-shrink-0 shadow-lg hover:border-brand-orange transition-all cursor-pointer group" onClick={() => openModal(car)}>
                          <div className="h-28 w-full relative overflow-hidden">
                            <img src={car.image} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500" alt={car.model} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }} />
                            {fipe > 0 && <div className="absolute top-2 right-2 bg-green-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">-{Math.round(((fipe - car.price) / fipe) * 100)}%</div>}
                          </div>
                          <div className="p-3">
                            <h5 className="font-bold text-white text-xs truncate mb-1">{car.make} {car.model}</h5>
                            <p className="text-brand-orange font-black text-sm mb-2">{formatCurrency(car.price)}</p>
                            <button onClick={(e) => { e.stopPropagation(); openModal(car); }} className="w-full bg-white/5 hover:bg-brand-orange hover:text-white border border-gray-600 hover:border-brand-orange text-gray-300 text-[10px] font-bold py-1.5 rounded transition uppercase">Ver Detalhes</button>
                          </div>
                        </div>
                      )
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
                <span className="ml-1">Caio está digitando...</span>
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
              placeholder="Digite sua dúvida..." 
              className="flex-1 bg-brand-dark border border-gray-700 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50 placeholder-gray-500 transition-all" 
              disabled={isTyping} 
            />
            <button 
              onClick={handleSendMessage} 
              disabled={isTyping || !inputMessage.trim()} 
              className="bg-brand-orange text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-90 shadow-lg"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};