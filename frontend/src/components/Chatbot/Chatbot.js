import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import '../../styles/components/_chatbot.scss';

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'https://chatbot-api-axel.vercel.app/api/chat';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Bonjour ! Je suis l'assistant d'Axel. Vous avez des questions sur son parcours, ses compétences ou ses projets ? Je suis là pour vous aider ! 😊",
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter((m) => m.role !== 'assistant' || m !== WELCOME_MESSAGE).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Erreur serveur');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Désolé, une erreur s'est produite. Veuillez réessayer ou utiliser le formulaire de contact.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot">
      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="chatbot__window">
          {/* Header */}
          <div className="chatbot__header">
            <div className="chatbot__header-info">
              <img className="chatbot__avatar" src="/logo_bot.webp" alt="Assistant d'Axel" />
              <div>
                <p className="chatbot__name">Assistant d'Axel</p>
                <p className="chatbot__status">En ligne</p>
              </div>
            </div>
            <button className="chatbot__close" onClick={() => setIsOpen(false)} aria-label="Fermer le chat">
              <FiX />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot__message chatbot__message--${msg.role}`}>
                <p>{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot__message chatbot__message--assistant">
                <div className="chatbot__typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot__input-area">
            <textarea
              ref={inputRef}
              className="chatbot__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className={`chatbot__send ${input.trim() && !isLoading ? 'chatbot__send--active' : ''}`}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Envoyer"
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        className={`chatbot__bubble ${isOpen ? 'chatbot__bubble--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Ouvrir le chat"
      >
        <span className="chatbot__bubble-icon">
          {isOpen ? <FiX /> : <FiMessageCircle />}
        </span>
        {!isOpen && (
          <span className="chatbot__bubble-label">Chat interactif d'Axel</span>
        )}
      </button>
    </div>
  );
};

export default Chatbot;
