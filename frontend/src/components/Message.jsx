export default function Message({ msg }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <strong>{msg.sender?.username || "User"}:</strong> {msg.text}
    </div>
  );
}
