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
import { Save, Download, Zap, IndianRupee, Trash2, GitCompare, MapPin, Search, Sun, BarChart3, Clock, TrendingUp, AlertTriangle, Compass } from "lucide-react";
import Skeleton from "../components/ui/Skeleton";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
  const [yearsRange, setYearsRange] = useState(10);
  const [loading, setLoading] = useState(true);
  const metricsRef = useRef(null);
  const [highlightMetrics, setHighlightMetrics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingLoadingId, setEditingLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Edit Data in Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const q = query(collection(db, "locations"), where("userId", "==", user.uid));

        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSavedLocations(data);

        console.log("Fetched from Firebase ✅", data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  // Toast System
  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

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

  useEffect(() => {
    if (!roi?.paybackYears) return;

    if (roi.paybackYears <= 10) setYearsRange(10);
    else if (roi.paybackYears <= 25) setYearsRange(25);
    else if (roi.paybackYears <= 50) setYearsRange(50);
    else setYearsRange(100);
  }, [roi.paybackYears]);

  const savingsData = generateSavingsData(roi.monthlySavings, roi.totalCost, yearsRange);
  const azimuthDiff = Math.abs(azimuth - 180);
  const azimuthColor = getSliderColor(azimuthDiff);
  const optimalTilt = Math.round(lat * 0.9);
  const tiltDiff = Math.abs(tiltAngle - optimalTilt);
  const tiltColor = getSliderColor(tiltDiff);
  const [showMap, setShowMap] = useState(false);

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

  // FIREBASE CLOUD (OLDER - LOCAL STORAGE FUNCTION)

  const handleSaveLocation = async () => {
    if (!auth.currentUser) {
      showToast("Please login first", "error");
      return;
    }

    setSaving(true);

    const newLocation = {
      name: customName || location || "Unnamed Setup",
      lat,
      lon,
      systemSize,
      usage,
      rate,
      azimuth,
      tiltAngle,
      isOnGrid,
      userId: auth.currentUser.uid,
      createdAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, "locations"), newLocation);

      setSavedLocations((prev) => [...prev, { ...newLocation, id: docRef.id }]);

      setCustomName("");

      showToast("Saved successfully ☁️");
    } catch (err) {
      console.error(err);
      showToast("Save failed ❌", "error");
    }

    setSaving(false);
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

  const handleDeleteLocation = async (id) => {
    setDeletingId(id);

    try {
      await deleteDoc(doc(db, "locations", id));

      setSavedLocations((prev) => prev.filter((item) => item.id !== id));

      showToast("Deleted successfully 🗑️");
    } catch (err) {
      console.error(err);
      showToast("Delete failed ❌", "error");
    }

    setDeletingId(null);
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
      setLoading(true); // start loading

      try {
        const data = await getSolarData(lat, lon);
        setSolarHistory(data);
      } catch (e) {
        console.error(e);
      }

      // smooth UX delay
      setTimeout(() => {
        setLoading(false);
      }, 500);
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

  const baseWeatherData = solarHistory.length > 0 ? getMonthlyFromDaily(solarHistory) : normalizedEstimatedData;

  const weatherBasedData = baseWeatherData.map((item) => ({
    ...item,
    energy: Math.round(item.energy * systemSize),
  }));

  const finalChartData = dataMode === "real" ? weatherBasedData : normalizedEstimatedData; // The Data Switching(Real or Estimated)

  //Scroll Clicking
  const scrollToMetrics = () => {
    metricsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setHighlightMetrics(true);

    setTimeout(() => {
      setHighlightMetrics(false);
    }, 1200);
  };

  const handleEditSave = async (id) => {
    setEditingLoadingId(id);

    try {
      await updateDoc(doc(db, "locations", id), {
        name: editValue,
      });

      setSavedLocations((prev) => prev.map((loc) => (loc.id === id ? { ...loc, name: editValue } : loc)));

      setEditingId(null);

      showToast("Updated successfully ✏️");
    } catch (err) {
      console.error(err);
      showToast("Update failed ❌", "error");
    }

    setEditingLoadingId(null);
  };

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 gap-6">
        {/* INPUT PANEL */}
        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Sun size={18} />
              Solar Setup
            </h2>

            <div className="flex gap-2">
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className={`
    px-3 py-2 rounded-lg text-white flex items-center gap-2
    transition-all
    ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--primary)] hover:opacity-90 active:scale-[0.97]"}
  `}
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    {" "}
                    <Save size={16} /> Save{" "}
                  </>
                )}
              </button>

              <button onClick={handleExport} className="px-3 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2 hover:opacity-90 active:scale-[0.97] active:shadow-inner transition-all">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* System Type */}
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-[var(--text-muted)]">System Type:</label>

            <button onClick={() => setIsOnGrid(true)} className={`px-3 py-1 rounded-lg ${isOnGrid ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"} active:scale-[0.97] active:shadow-inner`}>
              On-Grid
            </button>

            <button onClick={() => setIsOnGrid(false)} className={`px-3 py-1 rounded-lg ${!isOnGrid ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"} active:scale-[0.97] active:shadow-inner`}>
              Off-Grid
            </button>

            {roi.surplusEnergy > 0 && !isOnGrid && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle size={14} />
                {roi.surplusEnergy} kWh wasted due to off-grid setup
              </p>
            )}
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

                <div className="flex gap-2 relative">
                  {showMap && (
                    <div className="absolute top-full left-0 w-full mt-2 z-50">
                      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                        <div className="h-64">
                          <MapPicker setLat={setLat} setLon={setLon} setLocation={setLocation} onSelect={() => setShowMap(false)} />
                        </div>

                        <div className="p-2 text-xs text-[var(--text-muted)] text-center">Click on map to select location</div>
                      </div>
                    </div>
                  )}

                  <input
                    value={location}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const results = await searchLocations(location);
                        if (results.length > 0) {
                          setLat(results[0].lat);
                          setLon(results[0].lng);
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
                        setLon(results[0].lng);
                        setLocation(results[0].name);
                        setShowDropdown(false);
                      }
                    }}
                    className="mt-1 px-3 py-2 rounded-lg bg-[var(--primary)] text-white flex items-center gap-2 hover:opacity-90 active:scale-[0.97] active:shadow-inner transition-all"
                  >
                    <Search size={16} />
                  </button>

                  <button onClick={() => setShowMap((prev) => !prev)} className="mt-1 px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]">
                    <MapPin size={16} />
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
                <label className="text-sm text-[var(--text-muted)]">Electricity Rate (₹/kWh or Units)</label>
                <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="input mt-1" />
              </div>

              {/* Usage */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">Monthly Usage (kWh or Units)</label>
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
              <button
                onClick={scrollToMetrics}
                className="
    w-full mt-4 px-4 py-2 rounded-lg 
    bg-[var(--primary)] text-white 
    flex items-center justify-center gap-2
    hover:opacity-90 active:scale-[0.97] active:shadow-inner 
    transition-all
  "
              >
                <TrendingUp size={16} />
                Check Metrics
              </button>
            </div>
          </div>
        </Card>

        {/* SAVED LOCATIONS */}
        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4 tracking-tight">Saved Locations</h2>
          {/* FILTER PILLS */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSortBy("savings")}
              className={`
      px-3 py-1 rounded-full text-sm border transition-all duration-150
      ${sortBy === "savings" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
            >
              <span className="flex items-center gap-1">
                <IndianRupee size={14} />
                Savings
              </span>
            </button>

            <button
              onClick={() => setSortBy("output")}
              className={`
      px-3 py-1 rounded-full text-sm border transition-all duration-150
      ${sortBy === "output" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
            >
              <span className="flex items-center gap-1">
                <Zap size={14} />
                Output
              </span>
            </button>

            <button
              onClick={() => setSortBy("payback")}
              className={`
      px-3 py-1 rounded-full text-sm border transition-all duration-150
      ${sortBy === "payback" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
            >
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Payback
              </span>
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
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={() => handleLoadLocation(item)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
  p-4 rounded-xl border cursor-pointer transition-all duration-100
  ${rankColor}
  ${isActive ? "ring-2 ring-[var(--primary)] shadow-[0_0_20px_rgba(0,0,0,0.05)] scale-[1.01]" : ""}
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
                                handleEditSave(item.id);
                              }

                              if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            onBlur={() => handleEditSave(item.id)}
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

                        {editingLoadingId === item.id && <p className="text-xs text-[var(--text-muted)]">Saving...</p>}

                        <p className="text-xs text-[var(--text-muted)]">
                          {item.systemSize} kW • {item.usage} kWh • ₹{item.rate}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(item.id);
                          }}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(item);
                          }}
                          className="text-xs text-blue-500 hover:underline ml-2 flex items-center gap-1 active:scale-[0.97] active:shadow-inner"
                        >
                          <GitCompare size={14} />
                          {compareList.find((i) => i.id === item.id) ? "Remove" : "Compare"}
                        </button>
                      </div>
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
            <p className="text-xs text-[var(--text-muted)] mb-3">Based on estimated monthly savings</p>
            {/* Find Best */}
            {(() => {
              const [a, b] = compareList;

              const calcData = (item) => {
                const monthlyData = calculateMonthlyEnergy(item.systemSize, item.lat, item.azimuth, item.tiltAngle);

                const yearlyTotal = calculateYearlyTotal(monthlyData);
                const monthlyAvg = Math.round(yearlyTotal / 12);

                const roiData = calculateAdvancedROI({
                  systemSize: item.systemSize,
                  rate: item.rate,
                  monthlyEnergy: monthlyAvg, // ✅ correct now
                  usage: item.usage,
                  isOnGrid: item.isOnGrid,
                });

                return {
                  monthlyAvg,
                  savings: roiData.monthlySavings,
                  payback: roiData.paybackYears,
                  coverage: Math.min(100, Math.round((monthlyAvg / item.usage) * 100)),
                };
              };

              const dataA = calcData(a);
              const dataB = calcData(b);

              const better = dataA.savings > dataB.savings ? a : b;
              const worse = dataA.savings > dataB.savings ? b : a;

              const diffSavings = Math.abs(dataA.savings - dataB.savings);
              const diffOutput = Math.abs(dataA.monthlyAvg - dataB.monthlyAvg);

              const percentBetter = Math.round((diffSavings / Math.max(dataA.savings, dataB.savings)) * 100);

              let reason = "";

              const betterData = better.id === a.id ? dataA : dataB;
              const worseData = better.id === a.id ? dataB : dataA;

              // Output difference %
              const outputDiffPercent = Math.round(((betterData.monthlyAvg - worseData.monthlyAvg) / worseData.monthlyAvg) * 100);

              // Payback difference
              const paybackDiff = Math.round(worseData.payback - betterData.payback);

              // Build reason string
              const reasons = [];

              if (outputDiffPercent > 5) {
                reasons.push(`⚡ +${outputDiffPercent}% higher output`);
              }

              if (paybackDiff > 0) {
                reasons.push(`⏳ ${paybackDiff} yrs faster payback`);
              }

              if (diffSavings > 0) {
                reasons.push(`₹${diffSavings}/month more savings`);
              }

              reason = reasons.join(" and ");

              return (
                <div className="grid grid-cols-2 gap-6">
                  <div className="mb-5 p-5 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm">
                    <p className="font-semibold text-green-700 flex items-center gap-2">🏆 {better.name} is the better choice</p>

                    <p className="text-sm mt-1 text-green-700">
                      +₹{diffSavings}/month ({percentBetter}% higher savings)
                    </p>

                    <p className="text-xs text-[var(--text-muted)] mt-2">{reason || "Better overall performance based on your setup"}</p>
                  </div>

                  {compareList.map((item) => {
                    const isBest = better.id === item.id;

                    const { monthlyAvg, savings, payback, coverage } = calcData(item);

                    return (
                      <div
                        key={item.id}
                        className={`
        p-5 rounded-2xl border transition-all duration-200
        ${isBest ? "border-green-500 bg-green-50 shadow-md" : "border-[var(--border)] hover:shadow-sm"}
      `}
                      >
                        {/* HEADER */}
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{item.name}</p>

                          {isBest && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Best</span>}
                        </div>

                        {/* METRICS */}
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span>⚡ Output</span>
                            <span className={item.id === better.id ? "text-green-600 font-medium" : "text-red-500"}>{monthlyAvg} kWh</span>
                          </div>

                          <div className="flex justify-between">
                            <span>💰 Savings</span>
                            <span className={item.id === better.id ? "text-green-600 font-medium" : "text-red-500"}>₹{savings}</span>
                          </div>

                          <div className="flex justify-between">
                            <span>📊 Coverage</span>
                            <span>{coverage}%</span>
                          </div>

                          <div className="flex justify-between">
                            <span>⏳ Payback</span>
                            <span>{payback} yrs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        )}
      </div>

      {/* METRICS */}
      <div
        ref={metricsRef}
        className={`
    grid grid-cols-2 md:grid-cols-4 gap-6
    transition-all duration-500
    ${highlightMetrics ? "shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.01] brightness-[1.02]" : ""}
  `}
      >
        <Card className="transition-all duration-300  hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Direction Efficiency</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold">{Math.round(getDirectionEfficiency(azimuth) * 100)}%</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Monthly Output</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{monthlyAvg} kWh</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Yearly Output</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{yearlyTotal} kWh</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] tracking-tight">Optimal Tilt</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{tilt}°</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Optimal Direction</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{getDirectionLabel(180)} (180°)</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Usage Covered</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{coverage}%</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Used Energy</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{roi.usedEnergy} kWh</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Surplus Energy</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{roi.surplusEnergy} kWh</h2>}
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Monthly Savings</p>

          {loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="w-28 h-8" />
              <Skeleton className="w-24 h-4" />
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold mt-1 tracking-tight">₹{roi.monthlySavings}</h2>

              <p className="text-xs text-[var(--text-muted)] mt-1 text-green-500">₹{roi.monthlySavings * 12} yearly</p>
            </>
          )}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">Payback Period</p>

          {loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="w-28 h-8" />
              <Skeleton className="w-24 h-4" />
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold mt-1 tracking-tight">{roi.paybackYears} yrs</h2>
              <p className="text-xs text-[var(--text-muted)]">~{roi.paybackMonths} months</p>
            </>
          )}
        </Card>
      </div>

      {/* CHART */}
      <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setDataMode("real")}
            className={`
      px-3 py-1 rounded-full text-xs border transition-all duration-150
      ${dataMode === "real" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
          >
            <span className="flex items-center gap-1">
              <Sun size={14} />
              Real Data
            </span>
          </button>

          <button
            onClick={() => setDataMode("estimated")}
            className={`
      px-3 py-1 rounded-full text-xs border transition-all duration-150
      ${dataMode === "estimated" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
          >
            <span className="flex items-center gap-1">
              <BarChart3 size={14} />
              Estimated
            </span>
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-2">{dataMode === "real" ? "Based on last year's actual sunlight data" : "Based on calculated solar model"}</p>
        <h2 className="text-lg font-semibold mb-4 tracking-tight">Solar Production</h2>

        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-[var(--text-muted)]">Monthly generation (kWh)</p>

          <p className="text-sm font-medium">{yearlyTotal} kWh/year</p>
        </div>

        {loading ? <Skeleton className="w-full h-64" /> : <EnergyChart data={finalChartData} />}
      </Card>

      <div className="flex gap-2 mb-3">
        {[10, 25, 50, 100].map((year) => (
          <button
            key={year}
            onClick={() => setYearsRange(year)}
            className={`
        px-3 py-1 rounded-full text-xs border transition-all duration-150
        ${yearsRange === year ? "bg-[var(--primary)] text-white scale-[1.05]" : "border-[var(--border)] hover:opacity-90 active:scale-[0.97] active:shadow-inner"}
      `}
          >
            {year} yrs
          </button>
        ))}
      </div>

      <Card className="transition-all duration-300  hover:-translate-y-[2px] hover:shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Savings Over Time</h2>
          <span className="text-sm text-[var(--text-muted)]">10 Year Projection</span>
        </div>
        {loading ? <Skeleton className="skeleton w-full h-64" /> : <SavingsChart data={savingsData} />}
      </Card>

      {/*Toast*/}
      {toast && (
        <div
          className={`
      fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white
      ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}
      animate-fade-in
    `}
        >
          {toast.message}
        </div>
      )}
      <div className="flex justify-center items-center text-xs text-gray-400 mt-6">
        <span className="mr-1">Made by</span>
        <span className="font-medium text-gray-600 tracking-wide">Ajay Danu</span>
      </div>
    </div>
  );
}
