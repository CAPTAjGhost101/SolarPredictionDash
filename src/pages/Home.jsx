import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, TrendingUp, Zap, IndianRupee } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const stats = [
    { icon: <Zap />, label: "Energy Generated", value: "1200+ kWh" },
    { icon: <IndianRupee />, label: "Savings", value: "₹8,000/mo" },
    { icon: <TrendingUp />, label: "ROI", value: "3-5 yrs" },
  ];

  return (
    <div className="relative min-h-full px-6 py-16 flex flex-col items-center justify-center text-center">
      {/* 🔥 BACKGROUND GRADIENT GLOW */}
      <div className="absolute inset-0 -z-10 flex justify-center items-center">
        <div className="w-[600px] h-[600px] bg-[var(--primary)] opacity-20 blur-[140px] rounded-full" />
      </div>

      {/* ICON */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Sun size={60} className="text-[var(--primary)] mb-4" />
      </motion.div>

      {/* TITLE */}
      <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl md:text-6xl font-bold tracking-tight">
        Plan Solar Smarter ⚡
      </motion.h1>

      {/* SUBTITLE */}
      <motion.p initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-[var(--text-muted)] mt-4 max-w-xl">
        Predict energy production, calculate savings, and compare solar setups — all powered by real data.
      </motion.p>

      {/* CTA BUTTON */}
      <motion.button
        onClick={() => navigate("/dashboard")}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="
          mt-8 px-8 py-3 rounded-xl
          bg-[var(--primary)] text-white
          font-medium text-lg
          shadow-lg
          hover:scale-[1.07] hover:shadow-xl
          active:scale-[0.97]
          transition-all duration-200
        "
      >
        Go to Dashboard
      </motion.button>

      {/* STATS CARDS */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
        {stats.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="
              bg-[var(--card)]
              border border-[var(--border)]
              rounded-2xl p-6
              shadow-sm
              transition-all duration-300
              hover:shadow-lg flex flex-col items-center
            "
          >
            <div className="text-[var(--primary)] mb-3">{item.icon}</div>
            <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
            <h3 className="text-xl font-semibold mt-1">{item.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      {/* MINI FEATURE STRIP */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-16 text-sm text-[var(--text-muted)]">
        ✔ Real data • ✔ ROI insights • ✔ Compare setups • ✔ Save & export
      </motion.div>
    </div>
  );
}
