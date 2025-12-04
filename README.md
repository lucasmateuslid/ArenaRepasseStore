# 🏁 Arena Repasse

**Sistema interno de gerenciamento de veículos de repasse**  
Desenvolvido exclusivamente para a **Arena Auto Natal** — a solução completa para controle, automação e inteligência no repasse de veículos.

<p align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Arena+Repasse+-+Dashboard" alt="Arena Repasse Dashboard" />
</p>

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

---

## 🎯 Objetivo do Sistema

O **Arena Repasse** foi criado para revolucionar a operação de repasse de veículos da Arena Auto Natal, eliminando planilhas, processos manuais e perda de tempo.

### Principais benefícios:
- Centralização total dos veículos disponíveis para repasse
- Busca ultra-rápida com filtros inteligentes
- Redução drástica no tempo de atendimento ao comprador
- Controle rigoroso de acesso com autenticação segura
- Descrições comerciais geradas automaticamente por IA
- Comunicação instantânea via WhatsApp

---

## 🏢 Sobre a Arena Auto Natal

Empresa consolidada no mercado automotivo do Rio Grande do Norte, especializada em compra, venda e repasse de veículos seminovos e usados com procedência garantida.

O Arena Repasse é o sistema **exclusivo e sob medida** que suporta toda a operação interna de repasse da empresa.

---

## 🔐 Segurança & Controle de Acesso

| Recurso                        | Tecnologia/Implementação                     |
|-------------------------------|-----------------------------------------------|
| Autenticação                  | Supabase Auth (OAuth + Email/Senha)           |
| Controle de acesso            | Row Level Security (RLS) ativo                |
| Perfis de usuário             | Admin, Operador, Visualização                  |
| Dados sensíveis               | Criptografia em repouso e em trânsito         |
| Auditoria                     | Logs de acesso e alterações registradas       |

Acesso restrito apenas a colaboradores autorizados da Arena Auto Natal.

---

## 🤖 Inteligência Artificial Integrada

O sistema utiliza **Google Gemini (via Google AI Studio)** para:

- Geração automática de anúncios comerciais atrativos e padronizados
- Descrições técnicas detalhadas a partir de poucas informações
- Sugestão de preço de repasse com base em mercado
- Chat interno com respostas automáticas para consultas frequentes
- Categorização inteligente de veículos (destaque, oportunidade, etc.)

> “Antes levava 15 minutos para montar um anúncio. Hoje, em 30 segundos está pronto e perfeito.”  
> — Equipe Comercial Arena Auto Natal

---

## 🛠 Tecnologias Utilizadas

| Categoria         | Stack                                                                 |
|-------------------|------------------------------------------------------------------------|
| **Frontend**      | React 18 + Vite, TypeScript, TailwindCSS, shadcn/ui, Lucide Icons      |
| **Backend**       | Supabase (Postgres, Auth, Storage, Functions, RLS) + Node.js (proxy)   |
| **IA**            | Google AI Studio (Gemini 1.5 Flash/Pro)                                |
| **Comunicação**   | WhatsApp Web.js + API não oficial (em ambiente controlado)             |
| **Deploy**        | Vercel (Frontend) + Supabase Hosting                                        |
| **Monitoramento** | Vercel Analytics + Supabase Logs                                       |

---

## ✨ Principais Funcionalidades

- Catálogo completo com fotos, detalhes e status do veículo
- Filtros avançados (marca, modelo, ano, preço, câmbio, combustível, etc.)
- Dashboard administrativo com CRUD completo
- Geração de descrição com IA em 1 clique
- Envio direto para WhatsApp do comprador (com foto + descrição pronta)
- Histórico completo de repasses realizados
- Controle de veículos vendidos, reservados e disponíveis
- Responsivo (funciona perfeitamente no celular dos vendedores)

---

## 🚀 Status Atual do Projeto

| Fase                  | Status            | Observação                              |
|-----------------------|-------------------|-----------------------------------------|
| Autenticação + RLS    | Concluído      | 100% funcional e seguro                 |
| CRUD de Veículos      | Concluído      | Com upload de múltiplas fotos           |
| Integração Gemini     | Concluído      | Descrições automáticas ativas           |
| WhatsApp Automatizado | Concluído   | Envio com 1 clique                      |
| Chat IA Interno       | Em desenvolvimento | Previsto para dez/2025                  |
| Relatórios Gerenciais | Planejado        | Próximas sprints                        |

**Deploy contínuo ativo** — novas funcionalidades chegam semanalmente.

---

## 📞 Suporte & Manutenção

Projeto mantido internamente pela equipe de TI e Desenvolvimento da **Arena Auto Natal**.

Para reportar bugs, sugerir melhorias ou solicitar novas funcionalidades:  
Entre em contato pelo canal interno no WhatsApp ou Teams da empresa.

---

Feito com dedicação para quem realmente usa: a equipe que faz a Arena Auto Natal acontecer todos os dias.

**Arena Repasse © 2025 — Todos os direitos reservados.