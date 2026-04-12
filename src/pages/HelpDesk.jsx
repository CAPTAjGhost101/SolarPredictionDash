import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HelpDesk() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [activeSection, setActiveSection] = useState("basics");

  const basicsRef = useRef(null);
  const usageRef = useRef(null);
  const faqRef = useRef(null);

  const scrollTo = (ref, id) => {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  const faqs = [
    {
      q: "What is kWh?",
      a: "kWh (kilowatt-hour) is the unit of electricity. It represents how much energy you use or generate.",
    },
    {
      q: "How are savings calculated?",
      a: "Savings are calculated using the formula: Energy generated × electricity rate (₹/kWh). This gives an estimate of monthly and yearly savings.",
    },
    {
      q: "What is tilt angle?",
      a: "Tilt is the angle of your solar panel. Adjusting tilt closer to your latitude improves sunlight capture and increases efficiency.",
    },
    {
      q: "What is panel direction (azimuth)?",
      a: "Azimuth is the direction your panel faces. In India, south-facing panels provide the best performance.",
    },
    {
      q: "How accurate are the predictions?",
      a: "Predictions are based on solar irradiance models, system efficiency, tilt, and direction. They provide realistic estimates but may vary due to weather and installation quality.",
    },
    {
      q: "What is Optimize My Setup?",
      a: "This feature automatically adjusts tilt and direction to optimal values based on your location to improve energy output and savings.",
    },
    {
      q: "How does location selection work?",
      a: "You can enter a city manually, use your current location (GPS), or select a point on the map. The system uses this to estimate solar potential.",
    },
    {
      q: "What is payback period?",
      a: "Payback period is the time required to recover your solar system cost from savings. It is calculated using total system cost and yearly savings.",
    },
    {
      q: "Can I save and compare setups?",
      a: "Yes, you can save multiple solar configurations and compare their performance, savings, and payback period.",
    },
    {
      q: "What does the PDF report include?",
      a: "The report includes system details, energy production, savings, and financial analysis in a clean, shareable format.",
    },
  ];

  const filteredFaqs = faqs.filter((item) => item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase()));

  const highlightText = (text) => {
    if (!search) return text;

    const regex = new RegExp(`(${search})`, "gi");

    return text.split(regex).map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 text-black px-1 rounded">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-4 sm:p-6 gap-6 md:gap-8">
      {/* SIDEBAR */}
      <div className="w-56 hidden md:block">
        <div className="sticky top-20 space-y-2 text-sm">
          <p className="text-xs text-[var(--text-muted)] mb-2">GUIDE</p>

          <button onClick={() => scrollTo(basicsRef, "basics")} className={`block w-full text-left px-3 py-2 rounded-lg transition ${activeSection === "basics" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--border)]"}`}>
            Basics
          </button>

          <button onClick={() => scrollTo(usageRef, "usage")} className={`block w-full text-left px-3 py-2 rounded-lg transition ${activeSection === "usage" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--border)]"}`}>
            How to Use
          </button>

          <button onClick={() => scrollTo(faqRef, "faq")} className={`block w-full text-left px-3 py-2 rounded-lg transition ${activeSection === "faq" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--border)]"}`}>
            FAQ
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 space-y-10">
        {/* HERO */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Help & Guide</h1>
          <p className="text-sm text-[var(--text-muted)]">Learn how to use SolarAI to plan your solar setup, estimate energy production, and calculate savings.</p>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search help..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full px-4 py-2 rounded-xl
            border border-[var(--border)]
            bg-[var(--card)]
            text-sm
            focus:ring-2 focus:ring-[var(--primary)]
            outline-none
          "
        />

        {/* BASICS */}
        <div ref={basicsRef} className="space-y-4">
          <h2 className="text-xl font-semibold">Basics</h2>
          <p className="text-sm text-[var(--text-muted)]">SolarAI helps you estimate solar production and savings based on your location and system size.</p>
        </div>

        {/* HOW TO USE */}
        <div ref={usageRef} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">How to use</h2>

          <ol className="text-sm text-[var(--text-muted)] space-y-2 list-decimal list-inside">
            <li>Enter your location manually, use GPS, or select from the map</li>
            <li>Adjust system size, electricity rate, and monthly usage</li>
            <li>Optimize tilt and direction using the optimization feature</li>
            <li>Analyze energy production and savings through charts</li>
            <li>Save configurations and compare different setups</li>
            <li>Export a detailed PDF report for future reference</li>
          </ol>
        </div>

        {/* FEATURES OVERVIEW */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-lg font-semibold">Features Overview</h2>

          <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
            <li>Location-based solar energy estimation</li>
            <li>Real-time optimization of panel tilt and direction</li>
            <li>Interactive charts for production and savings</li>
            <li>Cloud-based saving of user configurations</li>
            <li>Multi-language and dark mode support</li>
            <li>Professional PDF export reports</li>
          </ul>
        </div>

        {/* FAQ */}
        <div ref={faqRef} className="space-y-4">
          <h2 className="text-lg font-semibold">FAQ</h2>

          {filteredFaqs.length === 0 && <p className="text-sm text-[var(--text-muted)]">No results found.</p>}

          {filteredFaqs.map((item, index) => (
            <div
              key={index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="
                border border-[var(--border)]
                rounded-xl p-4 bg-[var(--card)]
                cursor-pointer transition-all
                hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
              "
            >
              <div className="flex justify-between">
                <p className="font-medium">{highlightText(item.q)}</p>
                <motion.span animate={{ rotate: openIndex === index ? 45 : 0 }} transition={{ duration: 0.2 }}>
                  +
                </motion.span>
              </div>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                    <p className="text-sm text-[var(--text-muted)] mt-3">{highlightText(item.a)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
