import Card from "../components/ui/Card";
import EnergyChart from "../components/ui/EnergyChart";
import { calculateMonthlyEnergy, calculateYearlyTotal, calculateSavings, getOptimalTilt, getDirectionEfficiency } from "../utils/solarCalc";

import { calculateAdvancedROI } from "../utils/solarCalc";
import { generateSavingsData } from "../utils/solarCalc";
import SavingsChart from "../components/ui/SavingsChart";
import { searchLocations } from "../utils/geoCode";
import { useState, useRef } from "react";
import MapPicker from "../components/ui/MapPicker";
import { getDirectionLabel } from "../utils/solarCalc";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import { getSolarData } from "../utils/solarWeather";

export default function Dashboard() {
  // STATES
  const [location, setLocation] = useState("Delhi");
  const [rate, setRate] = useState(8);
  const [usage, setUsage] = useState(300);
  const [systemSize, setSystemSize] = useState(1);
  const [isOnGrid, setIsOnGrid] = useState(true);

  const [lat, setLat] = useState(28.6);
  const [lon, setLon] = useState(77.2);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const [azimuth, setAzimuth] = useState(180);
  const [tiltAngle, setTiltAngle] = useState(25);
  useEffect(() => {
    const optimalTilt = Math.round(lat * 0.9);
    const optimalAzimuth = 180;

    setTiltAngle(optimalTilt);
    setAzimuth(optimalAzimuth);
  }, [lat, lon]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [customName, setCustomName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [sortBy, setSortBy] = useState("savings");
  const [compareList, setCompareList] = useState([]);
  const [solarHistory, setSolarHistory] = useState([]);
  const [dataMode, setDataMode] = useState("real"); // "real" or "estimated"
  //SEARCH
  const handleSearch = (value) => {
    setLocation(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      const results = await searchLocations(value);
      setSuggestions(results);
      setShowDropdown(true);
    }, 400);
  };

  // CALCULATIONS
  const monthlyData = calculateMonthlyEnergy(systemSize, lat, azimuth, tiltAngle); // The Estimated Data
  const normalizedEstimatedData = monthlyData.map((item, i) => ({
    name: item.name || item.month || new Date(0, i).toLocaleString("default", { month: "short" }),

    energy: item.energy || item.value || (typeof item === "number" ? item : 0),
  }));
  const tilt = getOptimalTilt(lat);
  const yearlyTotal = calculateYearlyTotal(monthlyData);
  const monthlyAvg = Math.round(yearlyTotal / 12);
  const savings = calculateSavings(monthlyAvg, rate);
  const coverage = Math.min(100, Math.round((monthlyAvg / usage) * 100));
  const roi = calculateAdvancedROI({
    systemSize,
    rate,
    monthlyEnergy: monthlyAvg,
    usage,
    isOnGrid,
  });
  const savingsData = generateSavingsData(roi.monthlySavings, roi.totalCost, 10);
  const azimuthDiff = Math.abs(azimuth - 180);
  const azimuthColor = getSliderColor(azimuthDiff);
  const optimalTilt = Math.round(lat * 0.9);
  const tiltDiff = Math.abs(tiltAngle - optimalTilt);
  const tiltColor = getSliderColor(tiltDiff);

  // HELPER FUNCTIONS
  function getSliderColor(diff) {
    if (diff < 10) return "green";
    if (diff < 30) return "orange";
    return "red";
  }

  function getGradient(diff, maxDiff = 180) {
    const ratio = Math.min(diff / maxDiff, 1);

    // hue: green (120) → red (0)
    const hue = 120 - ratio * 120;

    return `linear-gradient(to right, hsl(${hue}, 80%, 50%), hsl(${hue}, 80%, 60%))`;
  }

  // LOCAL STORAGE FUNCTION
  useEffect(() => {
    const stored = localStorage.getItem("solar_locations");
    if (stored) {
      setSavedLocations(JSON.parse(stored));
    }
  }, []);

  const handleSaveLocation = () => {
    const newLocation = {
      id: Date.now(),
      name: customName || location || "Unnamed Setup",
      lat,
      systemSize,
      usage,
      rate,
      azimuth,
      tiltAngle,
      isOnGrid,
    };

    const updated = [...savedLocations, newLocation];

    setSavedLocations(updated);
    localStorage.setItem("solar_locations", JSON.stringify(updated));

    setCustomName(""); // reset after save
  };

  // LOAD FUNCTIONS
  const handleLoadLocation = (item) => {
    setLocation(item.name);
    setLat(item.lat);
    setLon(item.lon);
    setSystemSize(item.systemSize);
    setUsage(item.usage);
    setRate(item.rate);
    setAzimuth(item.azimuth);
    setTiltAngle(item.tiltAngle);
    setIsOnGrid(item.isOnGrid);
    setActiveId(item.id);
  };

  //DELETE FUNCTION
  const handleDeleteLocation = (id) => {
    const updated = savedLocations.filter((item) => item.id !== id);

    setSavedLocations(updated);
    localStorage.setItem("solar_locations", JSON.stringify(updated));
  };

  const getScore = (item) => {
    if (sortBy === "savings") {
      return item.systemSize * item.rate * 30;
    }

    if (sortBy === "output") {
      return item.systemSize;
    }

    if (sortBy === "payback") {
      return -(item.systemSize * item.rate);
    }

    return 0;
  };

  const sortedLocations = [...savedLocations].sort((a, b) => getScore(b) - getScore(a));

  function getRankColor(index, total) {
    const ratio = index / total;

    if (ratio < 0.25) return "bg-green-100 border-green-400";
    if (ratio < 0.5) return "bg-yellow-100 border-yellow-400";
    if (ratio < 0.75) return "bg-orange-100 border-orange-400";
    return "bg-red-100 border-red-400";
  }

  const toggleCompare = (item) => {
    const exists = compareList.find((i) => i.id === item.id);

    if (exists) {
      setCompareList(compareList.filter((i) => i.id !== item.id));
    } else {
      if (compareList.length < 2) {
        setCompareList([...compareList, item]);
      }
    }
  };

  // EXPORTS
  const handleExport = () => {
    const doc = new jsPDF();

    const name = customName || location || "User";

    // Title
    doc.setFontSize(18);
    doc.text(`${name}'s Solar Plan Prediction Report`, 10, 20);

    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text("Generated by Solar Optimization Dashboard", 10, 28);

    // Reset color
    doc.setTextColor(0);

    // Section: System Info
    doc.setFontSize(14);
    doc.text("System Details", 10, 45);

    doc.setFontSize(12);
    doc.text(`Location: ${location}`, 10, 55);
    doc.text(`System Size: ${systemSize} kW`, 10, 65);
    doc.text(`Electricity Rate: ₹${rate}/kWh`, 10, 75);
    doc.text(`Monthly Usage: ${usage} kWh`, 10, 85);
    doc.text(`System Type: ${isOnGrid ? "On-Grid" : "Off-Grid"}`, 10, 95);

    // Section: Performance
    doc.setFontSize(14);
    doc.text("Performance", 10, 115);

    doc.setFontSize(12);
    doc.text(`Monthly Output: ${monthlyAvg} kWh`, 10, 125);
    doc.text(`Yearly Output: ${yearlyTotal} kWh`, 10, 135);
    doc.text(`Coverage: ${coverage}%`, 10, 145);

    // Section: Financials
    doc.setFontSize(14);
    doc.text("Financial Analysis", 10, 165);

    doc.setFontSize(12);
    doc.text(`Monthly Savings: ₹${roi.monthlySavings}`, 10, 175);
    doc.text(`Yearly Savings: ₹${roi.yearlySavings}`, 10, 185);
    doc.text(`Payback Period: ${roi.paybackYears} years`, 10, 195);

    // Save
    doc.save(`${name}_solar_report.pdf`);
  };

  useEffect(() => {
    async function fetchData() {
      const data = await getSolarData(lat, lon);
      setSolarHistory(data);
      console.log("Solar API Data:", data);
    }

    fetchData();
  }, [lat, lon]);

  function getMonthlyFromDaily(dailyData) {
    const months = Array(12).fill(0);
    const counts = Array(12).fill(0);

    dailyData.forEach((val, i) => {
      if (val == null || isNaN(val)) return;

      const month = new Date(2024, 0, i + 1).getMonth();
      months[month] += val;
      counts[month]++;
    });

    return months.map((val, i) => ({
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      energy: counts[i] > 0 ? Math.round(val / counts[i]) : 0, // always valid
    }));
  }

  const weatherBasedData = solarHistory.length > 0 ? getMonthlyFromDaily(solarHistory) : monthlyData;
  console.log("Weather Data:", weatherBasedData); // The Real Data

  const finalChartData = dataMode === "real" ? weatherBasedData : normalizedEstimatedData; // The Data Switching(Real or Estimated)

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 gap-6">
        {/* INPUT PANEL */}
        <Card className="transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Solar Setup</h2>

            <div className="flex gap-2">
              <button onClick={handleSaveLocation} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white hover:scale-[1.03] active:scale-[0.97] transition-all">
                💾 Save
              </button>

              <button onClick={handleExport} className="px-3 py-2 rounded-lg bg-green-600 text-white hover:scale-[1.03] active:scale-[0.97] transition-all">
                📄 Export
              </button>
            </div>
          </div>

          {/* System Type */}
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-[var(--text-muted)]">System Type:</label>

            <button onClick={() => setIsOnGrid(true)} className={`px-3 py-1 rounded-lg ${isOnGrid ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"}`}>
              On-Grid
            </button>

            <button onClick={() => setIsOnGrid(false)} className={`px-3 py-1 rounded-lg ${!isOnGrid ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"}`}>
              Off-Grid
            </button>

            {roi.surplusEnergy > 0 && !isOnGrid && <p className="text-xs text-red-500 mt-1">⚠ {roi.surplusEnergy} kWh wasted due to off-grid setup</p>}
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-2 gap-6">
            {/* LEFT SIDE (Inputs) */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-muted)]">Setup Name</label>

                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="input mt-1" placeholder="e.g. Farm Land, Factory Roof" />
              </div>
              {/* Location */}
              <div className="relative z-20">
                <label className="text-sm text-[var(--text-muted)]">Enter your place:</label>

                <div className="flex gap-2">
                  <input
                    value={location}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const results = await searchLocations(location);
                        if (results.length > 0) {
                          setLat(results[0].lat);
                          setLon(results[0].lon);
                          setLocation(results[0].name);
                          setShowDropdown(false);
                        }
                      }
                    }}
                    className="input mt-1 flex-1"
                    placeholder="Search city"
                  />

                  <button
                    onClick={async () => {
                      const results = await searchLocations(location);
                      if (results.length > 0) {
                        setLat(results[0].lat);
                        setLon(results[0].lon);
                        setLocation(results[0].name);
                        setShowDropdown(false);
                      }
                    }}
                    className="mt-1 px-3 py-2 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    🔍
                  </button>
                </div>

                {/* Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-md z-10">
                    {suggestions.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setLocation(item.name);
                          setLat(item.lat);
                          setLon(item.lon);
                          setShowDropdown(false);
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-[var(--border)]"
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rate */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">Electricity Rate (₹/kWh)</label>
                <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="input mt-1" />
              </div>

              {/* Usage */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">Monthly Usage (kWh)</label>
                <input type="number" value={usage} onChange={(e) => setUsage(Number(e.target.value))} className="input mt-1" />
              </div>

              {/* System Size */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">System Size (kW)</label>
                <input type="number" value={systemSize} onChange={(e) => setSystemSize(Number(e.target.value))} className="input mt-1" />
              </div>
            </div>

            {/* RIGHT SIDE (Sliders) */}
            <div className="space-y-6">
              {/* Azimuth */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">Panel Direction: {azimuth}°</label>

                <input
                  type="range"
                  min="0"
                  max="360"
                  value={azimuth}
                  onChange={(e) => setAzimuth(Number(e.target.value))}
                  className="slider mt-2"
                  style={{
                    background: getGradient(azimuthDiff, 180),
                  }}
                />

                <p className="text-xs text-[var(--text-muted)] mt-1">{getDirectionLabel(azimuth)}</p>
              </div>

              {/* Tilt */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">Tilt Angle: {tiltAngle}°</label>

                <input
                  type="range"
                  min="0"
                  max="60"
                  value={tiltAngle}
                  onChange={(e) => setTiltAngle(Number(e.target.value))}
                  className="slider mt-2"
                  style={{
                    background: getGradient(tiltDiff, 60),
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SAVED LOCATIONS */}
        <Card className="transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4 tracking-tight">Saved Locations</h2>
          {/* FILTER PILLS */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSortBy("savings")}
              className={`
      px-3 py-1 rounded-full text-sm border transition-all duration-150
      ${sortBy === "savings" ? "bg-[var(--primary)] text-white scale-[1.05]" : "border-[var(--border)] hover:scale-[1.05]"}
    `}
            >
              💰 Savings
            </button>

            <button
              onClick={() => setSortBy("output")}
              className={`
      px-3 py-1 rounded-full text-sm border transition-all duration-150
      ${sortBy === "output" ? "bg-[var(--primary)] text-white scale-[1.05]" : "border-[var(--border)] hover:scale-[1.05]"}
    `}
            >
              ⚡ Output
            </button>

            <button
              onClick={() => setSortBy("payback")}
              className={`
      px-3 py-1 rounded-full text-sm border transition-all duration-150
      ${sortBy === "payback" ? "bg-[var(--primary)] text-white scale-[1.05]" : "border-[var(--border)] hover:scale-[1.05]"}
    `}
            >
              ⏱ Payback
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-3">Ranked by estimated annual savings (default)</p>
          {savedLocations.length === 0 && <p className="text-sm text-[var(--text-muted)]">No saved locations yet</p>}
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {sortedLocations.map((item, index) => {
                const isActive = activeId === item.id;
                const rankColor = getRankColor(index, sortedLocations.length);
                const isCompare = compareList.some((i) => i.id === item.id);
                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => handleLoadLocation(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
  p-4 rounded-xl border cursor-pointer transition-all duration-100
  ${rankColor}
  ${isActive ? "ring-2 ring-[var(--primary)] scale-[1.01]" : ""}
  ${isCompare ? "ring-2 ring-blue-400" : "hover:shadow-sm"}
`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        {editingId === item.id ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const updated = savedLocations.map((loc) => (loc.id === item.id ? { ...loc, name: editValue } : loc));

                                setSavedLocations(updated);
                                localStorage.setItem("solar_locations", JSON.stringify(updated));
                                setEditingId(null);
                              }

                              if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            onBlur={() => {
                              const updated = savedLocations.map((loc) => (loc.id === item.id ? { ...loc, name: editValue } : loc));

                              setSavedLocations(updated);
                              localStorage.setItem("solar_locations", JSON.stringify(updated));
                              setEditingId(null);
                            }}
                            className="input text-sm"
                            autoFocus
                          />
                        ) : (
                          <p
                            className="font-medium cursor-pointer"
                            onDoubleClick={() => {
                              setEditingId(item.id);
                              setEditValue(item.name);
                            }}
                          >
                            {item.name}
                          </p>
                        )}
                        <p className="text-xs text-[var(--text-muted)]">
                          {item.systemSize} kW • {item.usage} kWh • ₹{item.rate}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLocation(item.id);
                        }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(item);
                        }}
                        className="text-xs text-blue-500 hover:underline ml-2"
                      >
                        {compareList.find((i) => i.id === item.id) ? "Remove" : "Compare"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </Card>

        {/* COMPARE LIST */}
        {compareList.length === 2 && (
          <Card>
            <h2 className="text-lg font-semibold mb-4 tracking-tight">Compare Locations</h2>

            {/* Find Best */}
            {(() => {
              const [a, b] = compareList;

              const calcData = (item) => {
                const monthlyData = calculateMonthlyEnergy(item.systemSize, item.lat, item.azimuth, item.tiltAngle);

                const yearlyTotal = calculateYearlyTotal(monthlyData);
                const monthlyAvg = Math.round(yearlyTotal / 12);
                const savings = monthlyAvg * item.rate;

                return { monthlyAvg, savings };
              };

              const dataA = calcData(a);
              const dataB = calcData(b);

              const better = dataA.savings > dataB.savings ? a : b;
              const diffSavings = Math.abs(dataA.savings - dataB.savings);
              const diffOutput = Math.abs(dataA.monthlyAvg - dataB.monthlyAvg);

              const best = compareList.reduce((prev, curr) => {
                const prevScore = prev.systemSize * prev.rate;
                const currScore = curr.systemSize * curr.rate;
                return currScore > prevScore ? curr : prev;
              }, compareList[0]);

              return (
                <div className="grid grid-cols-2 gap-6">
                  <div className="mb-4 p-3 rounded-lg bg-[var(--border)] text-sm">
                    <p className="font-medium">{better.name} performs better</p>

                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      +₹{diffSavings}/month (₹{diffSavings * 12} yearly) • +{diffOutput} kWh
                    </p>
                  </div>
                  {compareList.map((item) => {
                    const isBest = best.id === item.id;

                    const monthlyData = calculateMonthlyEnergy(item.systemSize, item.lat, item.azimuth, item.tiltAngle);

                    const yearlyTotal = calculateYearlyTotal(monthlyData);
                    const monthlyAvg = Math.round(yearlyTotal / 12);
                    const savings = monthlyAvg * item.rate;

                    return (
                      <div
                        key={item.id}
                        className={`
                  p-5 rounded-2xl border transition-all
                  ${isBest ? "border-green-500 bg-green-50" : "border-[var(--border)]"}
                `}
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{item.name}</p>

                          {isBest && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">🏆 Best</span>}
                        </div>

                        {/* Data */}
                        <div className="mt-4 space-y-2 text-sm">
                          <p>⚡ Output: {monthlyAvg} kWh</p>
                          <p>💰 Savings: ₹{savings}</p>
                          <p>📐 Tilt: {item.tiltAngle}°</p>
                          <p>🧭 Direction: {getDirectionLabel(item.azimuth)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        )}

        {/* MAP */}
        <Card className="transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Select Location on Map</h2>
          <MapPicker setLat={setLat} setLon={setLon} setLocation={setLocation} />
        </Card>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Direction Efficiency</p>
          <h2 className="text-3xl font-semibold">{Math.round(getDirectionEfficiency(azimuth) * 100)}%</h2>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Monthly Output</p>
          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{monthlyAvg} kWh</h2>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Yearly Output</p>
          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{yearlyTotal} kWh</h2>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] tracking-tight">Optimal Tilt</p>

          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{tilt}°</h2>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)]tracking-tight">Optimal Direction</p>
          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{getDirectionLabel(180)} (180°)</h2>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Usage Covered</p>
          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{coverage}%</h2>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Used Energy</p>
          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{roi.usedEnergy} kWh</h2>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Surplus Energy</p>
          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{roi.surplusEnergy} kWh</h2>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Monthly Savings</p>

          <h2 className="text-3xl font-semibold mt-1 tracking-tight">₹{roi.monthlySavings}</h2>

          <p className="text-xs text-[var(--text-muted)] mt-1 text-green-500">₹{roi.monthlySavings * 12} yearly</p>
        </Card>

        <Card className="transition-all duration-300">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Payback Period</p>
          <h2 className="text-3xl font-semibold mt-1 tracking-tight">{roi.paybackYears} yrs</h2>
          <p className="text-xs text-[var(--text-muted)]">~{roi.paybackMonths} months</p>
        </Card>
      </div>

      {/* CHART */}
      <Card className="transition-all duration-300">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setDataMode("real")}
            className={`
      px-3 py-1 rounded-full text-xs border transition-all duration-150
      ${dataMode === "real" ? "bg-[var(--primary)] text-white scale-[1.05]" : "border-[var(--border)] hover:scale-[1.05]"}
    `}
          >
            ☀️ Real Data
          </button>

          <button
            onClick={() => setDataMode("estimated")}
            className={`
      px-3 py-1 rounded-full text-xs border transition-all duration-150
      ${dataMode === "estimated" ? "bg-[var(--primary)] text-white scale-[1.05]" : "border-[var(--border)] hover:scale-[1.05]"}
    `}
          >
            📊 Estimated
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-2">{dataMode === "real" ? "Based on last year's actual sunlight data" : "Based on calculated solar model"}</p>
        <h2 className="text-lg font-semibold mb-4 tracking-tight">Solar Production</h2>

        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-[var(--text-muted)]">Monthly generation (kWh)</p>

          <p className="text-sm font-medium">{yearlyTotal} kWh/year</p>
        </div>

        <EnergyChart data={finalChartData} />
      </Card>

      <Card className="transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Savings Over Time</h2>
          <span className="text-sm text-[var(--text-muted)]">10 Year Projection</span>
        </div>
        <SavingsChart data={savingsData} />
      </Card>
    </div>
  );
}
