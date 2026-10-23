export default function Metric({ label, value }) {
  const safeValue = Number(value ?? 0);
  const level =
    safeValue >= 85 ? "danger" :
    safeValue >= 70 ? "warn" :
    "";

  return (
    <div className="metric">
      <div className="metricHead">
        <span>{label}</span>
        <span>{safeValue.toFixed(1)}%</span>
      </div>

      <div className="bar">
        <div
          className={`barFill ${level}`}
          style={{ width: `${Math.min(safeValue, 100)}%` }}
        />
      </div>
    </div>
  );
}
