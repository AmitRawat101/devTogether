import { useEffect, useRef } from "react";

// ChatPanel: controlled input (value + onChange come from App) plus
// one small piece of local behavior — auto-scrolling to the newest
// message. That split (shared state up top, purely-visual behavior
// local) is a good example to talk through in an interview.
const ChatPanel = ({ messages, chatInput, onChatInputChange, onSend }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSend();
  };

  return (
    <section className="panel">
      <h2 className="panel-title">Chat</h2>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet — say hi.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="chat-message">
            <span className="chat-sender">{m.sender}</span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
        />
        <button className="btn-accent" onClick={onSend}>
          Send
        </button>
      </div>
    </section>
  );
};

export default ChatPanel;
