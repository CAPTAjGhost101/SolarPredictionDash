export default function HelpDesk() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Help Desk</h1>

      {/* Section */}
      <div className="space-y-2">
        <h2 className="font-medium">⚡ What is kWh?</h2>
        <p className="text-sm text-[var(--text-muted)]">kWh (kilowatt-hour) is the unit of electricity. It tells how much energy you use or generate.</p>
      </div>

      {/* Section */}
      <div className="space-y-2">
        <h2 className="font-medium">💰 How are savings calculated?</h2>
        <p className="text-sm text-[var(--text-muted)]">Savings = Energy generated × electricity rate (₹/kWh).</p>
      </div>

      {/* Section */}
      <div className="space-y-2">
        <h2 className="font-medium">📐 What is tilt angle?</h2>
        <p className="text-sm text-[var(--text-muted)]">Tilt is the angle of your solar panel. Optimal tilt improves sunlight capture.</p>
      </div>

      {/* Section */}
      <div className="space-y-2">
        <h2 className="font-medium">🧭 What is panel direction (azimuth)?</h2>
        <p className="text-sm text-[var(--text-muted)]">Direction your panel faces. In India, south-facing panels give best performance.</p>
      </div>

      {/* Section */}
      <div className="space-y-2">
        <h2 className="font-medium">🔌 On-grid vs Off-grid</h2>
        <p className="text-sm text-[var(--text-muted)]">On-grid systems send extra electricity to the grid. Off-grid systems store energy in batteries.</p>
      </div>

      {/* Section */}
      <div className="space-y-2">
        <h2 className="font-medium">📊 How to use this tool?</h2>
        <p className="text-sm text-[var(--text-muted)]">Enter your location, system size, and electricity rate to estimate solar output and savings.</p>
      </div>
    </div>
  );
}
