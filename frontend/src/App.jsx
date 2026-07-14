import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Editor from "@monaco-editor/react";

import JoinRoom from "./components/JoinRoom";
import RoomHeader from "./components/RoomHeader";
import UsersList from "./components/UsersList";
import ChatPanel from "./components/ChatPanel";

import "./App.css";

const WS_URL = "http://localhost:8080/ws";

const App = () => {
  // The STOMP client is an object with methods, not data the UI
  // renders directly — so it lives in a ref, not state. Putting it
  // in state would trigger extra re-renders for no visual benefit.
  const stompClientRef = useRef(null);

  // ---- connection / room state ----
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  // ---- editor state ----
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start coding here...");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // ---- room / social state ----
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUser, setTypingUser] = useState("");

  // Open the socket once on mount. Everything after this is driven
  // by messages coming back over the `/topic/${roomId}` subscription.
  useEffect(() => {
    const socket = new SockJS(WS_URL);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => setConnected(true);

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => stompClient.deactivate();
  }, []);

  // Central place that turns an incoming server message into state
  // updates. Kept as one function so the "shape" of server events is
  // easy to point to and explain in one spot.
  const handleIncomingMessage = (rawMessage) => {
    const data = JSON.parse(rawMessage.body);

    if (data.userJoined) setUsers(data.userJoined);

    if (data.chatMessage) {
      setMessages((prev) => [...prev, data.chatMessage]);
    }

    if (data.codeUpdate) setCode(data.codeUpdate);

    if (data.languageUpdate) setLanguage(data.languageUpdate);

    if (data.userTyping) {
      setTypingUser(`${data.userTyping} is typing...`);
      setTimeout(() => setTypingUser(""), 2000);
    }

    if (data.codeResponse) {
      const { stdout, stderr, exception, error } = data.codeResponse;
      setOutput(stdout || stderr || exception || error || "No output");
      setIsRunning(false);
    }
  };

  const joinRoom = () => {
    const client = stompClientRef.current;
    if (!connected || !client?.connected || !roomId || !userName) return;

    client.publish({
      destination: "/app/join",
      body: JSON.stringify({ roomId, userName }),
    });

    client.subscribe(`/topic/${roomId}`, handleIncomingMessage);
    setJoined(true);
  };

  const leaveRoom = () => {
    stompClientRef.current.publish({
      destination: "/app/leaveRoom",
      body: JSON.stringify({ roomId, userName }),
    });

    setJoined(false);
    setRoomId("");
    setUserName("");
    setMessages([]);
    setUsers([]);
    setOutput("");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);

    stompClientRef.current.publish({
      destination: "/app/codeChange",
      body: JSON.stringify({ roomId, code: newCode }),
    });

    stompClientRef.current.publish({
      destination: "/app/typing",
      body: JSON.stringify({ roomId, userName }),
    });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    stompClientRef.current.publish({
      destination: "/app/languageChange",
      body: JSON.stringify({ roomId, language: newLang }),
    });
  };

  const runCode = () => {
    if (!stompClientRef.current?.connected) return;
    setIsRunning(true);
    setOutput("Running...");

    stompClientRef.current.publish({
      destination: "/app/compileCode",
      body: JSON.stringify({ roomId, code, language }),
    });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    stompClientRef.current.publish({
      destination: "/app/chatMessage",
      body: JSON.stringify({
        roomId,
        sender: userName,
        text: chatInput,
        time: Date.now(),
      }),
    });

    setChatInput("");
  };

  // ---- render ----

  if (!connected) {
    return (
      <div className="join-screen">
        <p className="connecting-text">Connecting to server…</p>
      </div>
    );
  }

  if (!joined) {
    return (
      <JoinRoom
        roomId={roomId}
        userName={userName}
        onRoomIdChange={setRoomId}
        onUserNameChange={setUserName}
        onJoin={joinRoom}
      />
    );
  }

  return (
    <div className="workspace">
      <RoomHeader
        roomId={roomId}
        onlineCount={users.length}
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={runCode}
        onLeave={leaveRoom}
        isRunning={isRunning}
      />

      {typingUser && <p className="typing-indicator">{typingUser}</p>}

      <div className="workspace-grid">
        <div className="editor-column">
          <div className="editor-frame">
            <Editor
              height="450px"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={handleCodeChange}
            />
          </div>

          <div className="output-console">
            <span className="output-prompt">$</span>
            <pre>{output || "Output will appear here"}</pre>
          </div>
        </div>

        <div className="sidebar-column">
          <UsersList users={users} />
          <ChatPanel
            messages={messages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
