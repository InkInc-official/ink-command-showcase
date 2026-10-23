export default function StatusBadge({ status }) {
  const safeStatus = status || "unknown";

  return (
    <span className={`status ${safeStatus}`}>
      <span className="dot" />
      {safeStatus}
    </span>
  );
}
