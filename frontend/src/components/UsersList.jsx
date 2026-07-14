// UsersList: takes the array of names from App and renders it.
// Derives initials for the avatar circle instead of storing them,
// which is a nice small talking point ("derived data vs stored state").
const getInitials = (name) =>
  name
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const UsersList = ({ users }) => {
  return (
    <section className="panel">
      <h2 className="panel-title">Online ({users.length})</h2>
      <ul className="users-list">
        {users.map((name, i) => (
          <li key={`${name}-${i}`} className="user-row">
            <span className="avatar">{getInitials(name)}</span>
            <span>{name}</span>
            <span className="presence-dot" />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default UsersList;
