
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
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
    { role: 'model', text: 'Olá! Sou o Caio, consultor especialista da Arena Repasse.\n\nEstou aqui para encontrar a melhor oportunidade para você. O que procura hoje?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const aiClient = React.useMemo(() => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.warn("API Key não encontrada em process.env.API_KEY");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Melhor limpeza e extração de JSON
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

    if (!aiClient) {
      setMessages(prev => [...prev, { role: "model", text: "Erro: chave de API não configurada no sistema." }]);
      return;
    }

    const userMsg = inputMessage;
    
    // Atualiza UI imediatamente
    const newMessages = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      // 1. Prepara o Histórico para o Gemini
      // Mapeia o estado do React para o formato que a API espera (Content[])
      const history: Content[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // 2. Prepara o Estoque (Contexto Dinâmico)
      const inventory = cars.map(c => 
        `ID:${c.id} | ${c.make} ${c.model} ${c.year} | Preço: R$${c.price} | FIPE: R$${c.fipeprice} | Categoria: ${c.category} | ${(c.description || '').substring(0, 50)}...`
      ).join("\n");

      // 3. Define a Persona e Regras (System Instruction)
      const systemInstruction = `
VOCÊ É Caio, consultor especialista da Arena Repasse.

OBJETIVO: Vender carros do estoque abaixo.
ESTOQUE ATUAL (Use apenas estes dados):
${inventory}

REGRAS DE CONTEXTO E MEMÓRIA:
1. Você DEVE lembrar do que foi dito nas mensagens anteriores (history).
2. Se o usuário disser "gostei desse", "tem automático?", "e o preço?", refira-se ao último carro mencionado no histórico.
3. Se o usuário mudar de assunto (ex: pedir outro tipo de carro), esqueça o anterior e foque no novo.

REGRAS DE RESPOSTA (JSON):
1. Responda APENAS com JSON válido. NADA de markdown.
2. Formato:
{
  "reply": "texto curto, persuasivo e humano (máx 200 caracteres)",
  "car_ids": ["id_encontrado_1"]
}
3. Se não encontrar carros exatos, sugira similares e explique o porquê.
4. Se o usuário só estiver cumprimentando ou agradecendo, mande "car_ids": [] e converse normalmente.

IDENTIDADE:
- Vendedor experiente, ágil e educado.
- Use gatilhos mentais: "oportunidade única", "abaixo da tabela", "tá saindo rápido".
- Tente sempre fechar uma visita ou contato no WhatsApp.

PERGUNTA ATUAL DO USUÁRIO: "${userMsg}"
      `.trim();

      // 4. Cria a Sessão de Chat com Histórico
      const chatSession = aiClient.chats.create({
        model: "gemini-2.5-flash",
        config: {
          temperature: 0.3, // Baixa temperatura para fidelidade aos dados
          systemInstruction: systemInstruction,
        },
        history: history // Injeta o histórico aqui
      });

      // 5. Envia a nova mensagem
      const result: GenerateContentResponse = await chatSession.sendMessage({
        message: `Responda estritamente em JSON.`
      });

      const parsed = cleanAndParseJSON(result.text || "");

      if (parsed && parsed.reply) {
        // Valida IDs retornados
        const validIds = Array.isArray(parsed.car_ids)
          ? parsed.car_ids.filter((id: string) => cars.some(c => c.id === id))
          : [];

        setMessages(prev => [
          ...prev,
          { role: "model", text: parsed.reply, recommendedCarIds: validIds }
        ]);
      } else {
        // Fallback caso a IA não retorne JSON
        setMessages(prev => [
          ...prev,
          { role: "model", text: "Entendi. Pode me dar mais detalhes do que você precisa?", recommendedCarIds: [] }
        ]);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: "model", text: "Desculpe, tive uma pequena falha de conexão. Pode repetir?" }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Buttons */}
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

      {/* Main Chat */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 bg-brand-surface rounded-xl shadow-2xl z-40 flex flex-col border border-gray-700 overflow-hidden animate-slide-up" style={{ height: '500px', maxHeight: '70vh' }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-darkRed to-black p-4 flex items-center gap-3 border-b border-gray-700 shadow-md">
            <div className="relative">
              <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center text-brand-orange text-lg border-2 border-brand-orange">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm">Caio - Arena Repasse</h4>
              <p className="text-[10px] text-gray-400">Consultor Inteligente</p>
            </div>

            <button onClick={() => setIsChatOpen(false)} className="ml-auto text-gray-400 hover:text-white">
              <i className="fa-solid fa-chevron-down"></i>
            </button>
          </div>

          {/* Messages */}
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

                {/* Recomendações */}
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
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }}
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
                            <button
                              onClick={(e) => { e.stopPropagation(); openModal(car); }}
                              className="w-full bg-white/5 hover:bg-brand-orange hover:text-white border border-gray-600 hover:border-brand-orange text-gray-300 text-[10px] font-bold py-1.5 rounded transition uppercase"
                            >
                              Ver Detalhes
                            </button>
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
                <span className="ml-1">Caio está digitando...</span>
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input */}
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
    