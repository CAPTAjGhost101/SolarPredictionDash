import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Dot } from "recharts";

export default function SavingsChart({ data }) {
  if (!data) return <div>Loading...</div>;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="year" stroke="#94A3B8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: "10px",
            }}
            labelStyle={{ color: "var(--text)" }}
            formatter={(value, _name, props) => {
              if (props.payload.isBreakEven) {
                return [`₹${value} 🎯 Break-even`, "Savings"];
              }
              return [`₹${value}`, "Savings"];
            }}
          />
          <Line
            type="monotone"
            dataKey="savings"
            stroke="var(--primary)"
            strokeWidth={3}
            dot={(props) => {
              const { cx, cy, payload } = props;

              if (payload.isBreakEven) {
                return <circle cx={cx} cy={cy} r={6} fill="green" stroke="white" strokeWidth={2} />;
              }

              return <Dot {...props} r={0} />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
