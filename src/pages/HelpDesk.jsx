import { useState, useRef } from "react";

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
      a: "Savings = Energy generated × electricity rate (₹/kWh).",
    },
    {
      q: "What is tilt angle?",
      a: "Tilt is the angle of your solar panel. Optimal tilt improves sunlight capture and efficiency.",
    },
    {
      q: "What is panel direction (azimuth)?",
      a: "It is the direction your panel faces. In India, south-facing panels give the best performance.",
    },
    {
      q: "On-grid vs Off-grid",
      a: "On-grid systems send excess electricity to the grid. Off-grid systems store energy in batteries.",
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
    <div className="flex max-w-6xl mx-auto p-6 gap-8">
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
            <li>Enter location or select from map</li>
            <li>Adjust system size and usage</li>
            <li>View charts and savings</li>
            <li>Save and compare setups</li>
          </ol>
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
                hover:shadow-md hover:scale-[1.01]
              "
            >
              <div className="flex justify-between">
                <p className="font-medium">{highlightText(item.q)}</p>
                <span>{openIndex === index ? "−" : "+"}</span>
              </div>

              {openIndex === index && <p className="text-sm text-[var(--text-muted)] mt-3">{highlightText(item.a)}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
