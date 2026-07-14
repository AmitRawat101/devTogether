// JoinRoom: simple controlled form. Owns no state itself —
// the room id / name live in App and get passed down as props.
// This keeps App as the single source of truth, which is easy
// to explain: "one component holds state, children just render it."
const JoinRoom = ({ roomId, userName, onRoomIdChange, onUserNameChange, onJoin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin();
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <p className="join-eyebrow">// connect</p>
        <h1 className="join-title">Join a code room</h1>
        <p className="join-subtitle">
          Enter a room id to create or rejoin a live session.
        </p>

        <form onSubmit={handleSubmit} className="join-form">
          <label className="field">
            <span>Room ID</span>
            <input
              value={roomId}
              onChange={(e) => onRoomIdChange(e.target.value)}
              placeholder="e.g. team-standup"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Your name</span>
            <input
              value={userName}
              onChange={(e) => onUserNameChange(e.target.value)}
              placeholder="e.g. Priya"
            />
          </label>

          <button type="submit" disabled={!roomId || !userName}>
            Join room
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;
