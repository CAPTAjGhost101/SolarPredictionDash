import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { YAxis } from "recharts";
export default function EnergyChart({ data }) {
  if (!data) return <div>Loading...</div>;
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="name" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip formatter={(value) => [`${value} kWh`, "Energy"]} labelFormatter={(label) => `Month: ${label}`} />
          <Line type="monotone" dataKey="energy" stroke="var(--primary)" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
