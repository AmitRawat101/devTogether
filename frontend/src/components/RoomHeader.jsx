// RoomHeader: purely presentational — receives everything via props
// and calls the handlers it's given. No logic lives here on purpose,
// so it's an easy "dumb component" example to point to in an interview.
const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const RoomHeader = ({
  roomId,
  onlineCount,
  language,
  onLanguageChange,
  onRun,
  onLeave,
  isRunning,
}) => {
  return (
    <header className="room-header">
      <div className="room-header-left">
        <span className="live-dot" aria-hidden="true" />
        <div>
          <h1 className="room-name">{roomId}</h1>
          <p className="room-meta">{onlineCount} online</p>
        </div>
      </div>

      <div className="room-header-right">
        <select value={language} onChange={onLanguageChange}>
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <button className="btn-accent" onClick={onRun} disabled={isRunning}>
          {isRunning ? "Running…" : "Run code"}
        </button>

        <button className="btn-outline" onClick={onLeave}>
          Leave room
        </button>
      </div>
    </header>
  );
};

export default RoomHeader;
