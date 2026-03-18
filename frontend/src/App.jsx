import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Editor from "@monaco-editor/react";
import "./App.css";

const App = () => {
  const stompClientRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start coding here...");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [output, setOutput] = useState("");
  const [typing, setTyping] = useState("");

  // ================= CONNECT =================
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");

    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      console.log("Connected to WebSocket");
      setConnected(true);
    };

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, []);

  // ================= JOIN ROOM =================
  const joinRoom = () => {
    if (!connected || !stompClientRef.current?.connected) return;
    if (!roomId || !userName) return;

    stompClientRef.current.publish({
      destination: "/app/join",
      body: JSON.stringify({ roomId, userName }),
    });

    stompClientRef.current.subscribe(`/topic/${roomId}`, (message) => {
      const data = JSON.parse(message.body);

      if (data.userJoined) setUsers(data.userJoined);

      if (data.chatMessage) {
        setMessages((prev) => [...prev, data.chatMessage]);
      }

      if (data.codeUpdate) setCode(data.codeUpdate);

      if (data.userTyping) {
        setTyping(data.userTyping + " is typing...");
        setTimeout(() => setTyping(""), 2000);
      }

      if (data.languageUpdate) setLanguage(data.languageUpdate);

      // ✅ Handle OneCompiler Response
      if (data.codeResponse) {
        const res = data.codeResponse;

        if (res.stdout) setOutput(res.stdout);
        else if (res.stderr) setOutput(res.stderr);
        else if (res.exception) setOutput(res.exception);
        else if (res.error) setOutput(res.error);
        else setOutput("No Output");
      }
    });

    setJoined(true);
  };

  // ================= CHAT =================
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

  // ================= CODE CHANGE =================
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

  // ================= LANGUAGE CHANGE =================
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    stompClientRef.current.publish({
      destination: "/app/languageChange",
      body: JSON.stringify({ roomId, language: newLang }),
    });
  };

  // ================= RUN CODE =================
  const runCode = () => {
    if (!stompClientRef.current?.connected) return;

    setOutput("Running...");

    stompClientRef.current.publish({
      destination: "/app/compileCode",
      body: JSON.stringify({
        roomId,
        code,
        language,
      }),
    });
  };

  // ================= LEAVE =================
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

  // ================= UI =================
  if (!connected)
    return (
      <div className="join-container">
        <h2>Connecting...</h2>
      </div>
    );

  if (!joined)
    return (
      <div className="join-container">
        <h2>Join Code Room</h2>

        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <input
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button onClick={joinRoom}>Join Room</button>
      </div>
    );

  return (
    <div className="editor-container">
      <h3>Room: {roomId}</h3>
      {typing && <p>{typing}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "25px",
        }}
      >
        {/* LEFT SIDE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", gap: "15px" }}>
            <select value={language} onChange={handleLanguageChange}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <button onClick={runCode}>Run Code</button>
            <button onClick={leaveRoom}>Leave Room</button>
          </div>

          <Editor
            height="450px"
            theme="vs-dark"
            language={language}
            value={code}
            onChange={handleCodeChange}
          />

          <textarea
            value={output}
            readOnly
            placeholder="Output..."
            style={{ height: "120px" }}
          />
        </div>

        {/* RIGHT SIDE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h3>Users</h3>
            <ul>
              {users.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Chat</h3>

            <div className="chat-box">
              {messages.map((m, i) => (
                <div key={i}>
                  <b>{m.sender}:</b> {m.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <input
                style={{ flex: 1 }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
