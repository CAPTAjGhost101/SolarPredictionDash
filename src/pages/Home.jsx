import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, TrendingUp, Zap, IndianRupee, Lightbulb } from "lucide-react";
import CountUp from "react-countup";
import { useEffect, useState } from "react";

export default function Home() {
  const [glowSun, setGlowSun] = useState(false);
  const [glowText, setGlowText] = useState(false);
  const [ctaPulse, setCtaPulse] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setGlowSun(true), 300);
    const t2 = setTimeout(() => setGlowText(true), 900);
    const t3 = setTimeout(() => setCtaPulse(true), 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
  const navigate = useNavigate();

  const stats = [
    {
      icon: <Zap />,
      label: "Energy Generated",
      value: 1200,
      suffix: "+ kWh",
    },
    {
      icon: <IndianRupee />,
      label: "Savings",
      value: 8000,
      prefix: "₹",
      suffix: "/mo",
    },
    {
      icon: <TrendingUp />,
      label: "ROI",
      value: 3,
      suffix: "-5 yrs",
    },
  ];

  return (
    <div className="relative min-h-full px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
      {/* 🔥 BACKGROUND GRADIENT GLOW */}
      <div className="absolute inset-0 -z-10 flex justify-center items-center">
        <div className="w-[600px] h-[600px] bg-[var(--primary)] opacity-20 blur-[140px] rounded-full" />
      </div>

      {/* ICON */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Sun
          size={60}
          className={`
    text-[var(--primary)] mb-4
    transition-all duration-700
    ${glowSun ? "drop-shadow-[0_0_25px_rgba(245,158,11,0.8)] scale-110" : ""}
  `}
        />
      </motion.div>

      {/* TITLE */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`
  text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight
  flex items-center gap-2 sm:gap-3 flex-wrap
  transition-all duration-700
  ${glowText ? "drop-shadow-[0_0_10px_rgba(245,158,11,0.25)]" : ""}
`}
      >
        <span>Plan Solar Smarter</span>
        <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
      </motion.h1>

      {/* SUBTITLE */}
      <motion.p initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-[var(--text-muted)] mt-4 max-w-xl">
        Predict energy production, calculate savings, and compare solar setups — all powered by real data.
      </motion.p>

      {/* CTA BUTTON */}
      <motion.button
        onClick={() => navigate("/dashboard")}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: ctaPulse ? [1, 1.04, 1] : 1,
        }}
        transition={{
          opacity: { duration: 0.6, delay: 0.6 }, // fade in once
          scale: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className="
    mt-8 px-8 py-3 rounded-xl
    bg-[var(--primary)] text-white
    font-medium text-lg
    shadow-lg
    hover:scale-[1.07] hover:shadow-xl
    active:scale-[0.97]
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
              hover:shadow-lg flex flex-col items-center backdrop-blur-md bg-white/10 border border-white/20
            "
          >
            <div className="text-[var(--primary)] mb-3">{item.icon}</div>
            <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
            <h3 className="text-xl font-semibold mt-1">
              <CountUp end={item.value} duration={3} separator="," prefix={item.prefix || ""} suffix={item.suffix || ""} />
            </h3>
          </motion.div>
        ))}
      </motion.div>

      {/* MINI FEATURE STRIP */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 text-sm text-[var(--text-muted)]">
        ✔ Real Data • ✔ ROI Insights • ✔ Compare Setups • ✔ Save & Export
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-8 text-sm text-[var(--text-muted)]">
        <div className="flex justify-center items-center text-xs text-gray-600">
          <span className="mr-1 gradient-text">Made by</span>
          <span className="font-medium text-gray-400 tracking-wide gradient-text">Ajay Danu</span>
        </div>
      </motion.div>
    </div>
  );
}
