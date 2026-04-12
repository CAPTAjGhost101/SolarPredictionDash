import Card from "../components/ui/Card";
import EnergyChart from "../components/ui/EnergyChart";
import { calculateMonthlyEnergy, calculateYearlyTotal, calculateSavings, getOptimalTilt, getDirectionEfficiency } from "../utils/solarCalc";
import { calculateAdvancedROI } from "../utils/solarCalc";
import { generateSavingsData } from "../utils/solarCalc";
import SavingsChart from "../components/ui/SavingsChart";
import { reverseGeocode, searchLocations } from "../utils/geoCode";
import { useState, useRef } from "react";
import MapPicker from "../components/ui/MapPicker";
import { getDirectionLabel } from "../utils/solarCalc";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import { getSolarData } from "../utils/solarWeather";
import { Save, Download, Zap, IndianRupee, Trash2, GitCompare, MapPin, Search, Sun, BarChart3, Clock, TrendingUp, AlertTriangle, Compass, LocateFixed, WandSparkles, Sparkles } from "lucide-react";
import Skeleton from "../components/ui/Skeleton";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSettings } from "../context/SettingsContext";
import { useTranslate } from "../utils/useTranslate";

export default function Dashboard() {
  // STATES
  const [location, setLocation] = useState("Delhi");
  const [rate, setRate] = useState(8);
  const [usage, setUsage] = useState(300);
  const [systemSize, setSystemSize] = useState(1);
  const [systemCost, setSystemCost] = useState(60000);
  const [isOnGrid, setIsOnGrid] = useState(true);
  const [lat, setLat] = useState(28.6);
  const [lon, setLon] = useState(77.2);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const [azimuth, setAzimuth] = useState(180);
  const [tiltAngle, setTiltAngle] = useState(25);

  useEffect(() => {
    const optimalTilt = getOptimalTilt(lat);
    const optimalAzimuth = 180;

    setTiltAngle(optimalTilt);
    setAzimuth(optimalAzimuth);
  }, [lat, lon]);

  useEffect(() => {
    const estimatedCost = systemSize * settings.defaultCost; // ₹60k per kW
    setSystemCost(estimatedCost);
  }, [systemSize]);

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
  const { settings } = useSettings();

  //Helper for Settings
  const currencySymbol = settings.currency === "INR" ? "₹" : "$";
  const unitLabel = settings.unit === "kwh" ? "kwh" : "Units";

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

  //Search
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
    totalCost: systemCost,
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
  const optimalTilt = getOptimalTilt(lat);
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

  // FIREBASE CLOUD (OLDER TO LOCAL STORAGE FUNCTION)

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

    let y = 20;

    // HEADER BAR
    doc.setFillColor(255, 115, 0);
    doc.rect(0, 0, 210, 25, "F");

    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.text("Solar Planner Report", 10, 16);

    doc.setTextColor(0);

    // TITLE
    y += 15;
    doc.setFontSize(16);
    doc.text(name, 10, y);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Generated by SolarPlanner by Ajay Danu", 10, y + 6);

    doc.setTextColor(0);

    // CARD FUNCTION
    const drawCard = (title, lines) => {
      y += 12;

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(10, y, 190, 28, 4, 4, "F");

      doc.setFontSize(12);
      doc.setTextColor(255, 115, 0);
      doc.text(title, 14, y + 8);

      doc.setTextColor(0);
      doc.setFontSize(10);

      lines.forEach((line, i) => {
        doc.text(line, 14, y + 15 + i * 6);
      });

      y += 30;
    };

    // SYSTEM
    drawCard("System Details", [`Location: ${location}`, `System Size: ${systemSize} kW`, `Electricity Rate: ₹${rate}/kWh`]);

    // PERFORMANCE
    drawCard("Performance", [`Monthly Output: ${monthlyAvg} kWh`, `Yearly Output: ${yearlyTotal} kWh`, `Coverage: ${coverage}%`]);

    // FINANCIAL
    drawCard("Financial Analysis", [`Monthly Savings: ₹${roi.monthlySavings}`, `Yearly Savings: ₹${roi.yearlySavings}`, `Payback: ${roi.paybackYears} years`]);

    // FOOTER
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("© SolarPlannerv2.1 • Smart Solar Planning", 10, 285);

    doc.save(`${name}_solarplanner_report.pdf`);
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

  const { t } = useTranslate();

  //OPTIMISATION LOGIC BELOW
  const optimalTiltValue = getOptimalTilt(lat);
  const optimalAzimuthValue = 180;

  const tiltDiffValue = Math.abs(tiltAngle - optimalTiltValue);
  const azimuthDiffValue = Math.abs(azimuth - optimalAzimuthValue);

  const improvementPercent = Math.round((tiltDiffValue / 90) * 10 + (azimuthDiffValue / 180) * 10);

  //GPS FUNCTION
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        setLat(latitude);
        setLon(longitude);

        const name = await reverseGeocode(latitude, longitude);
        if (name) setLocation(name);
      },
      () => {
        alert("Location access denied");
      },
    );
  };

  return (
    <div className="md:p-8 p-4 sm:p-6 space-y-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUT PANEL */}
        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            {/* TITLE */}
            <h2 className="text-base sm:text-lg font-semibold tracking-tight flex items-center gap-2">
              <Sun size={18} />
              <span className="truncate">{t("solarSetup")}</span>
            </h2>

            {/* BUTTONS */}
            <div className="flex sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className={`
        w-full sm:w-auto
        px-3 py-2 rounded-lg text-white
        flex items-center justify-center gap-2
        text-sm font-medium
        transition-all
        ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--primary)] hover:opacity-90 active:scale-[0.97]"}
      `}
              >
                {saving ? (
                  t("saving")
                ) : (
                  <>
                    <Save size={16} />
                    <span>{t("save")}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExport}
                className="
        w-full sm:w-auto
        px-3 py-2 rounded-lg
        bg-green-600 text-white
        flex items-center justify-center gap-2
        text-sm font-medium
        hover:opacity-90 active:scale-[0.97]
        transition-all
      "
              >
                <Download size={16} />
                <span>{t("export")}</span>
              </button>
            </div>
          </div>

          {/* System Type */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <label className="text-sm text-[var(--text-muted)]">{t("systemType")}</label>

            <button onClick={() => setIsOnGrid(true)} className={`px-3 py-1 rounded-lg ${isOnGrid ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"} active:scale-[0.97] active:shadow-inner`}>
              {t("onGrid")}
            </button>

            <button onClick={() => setIsOnGrid(false)} className={`px-3 py-1 rounded-lg ${!isOnGrid ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"} active:scale-[0.97] active:shadow-inner`}>
              {t("offGrid")}
            </button>

            {roi.surplusEnergy > 0 && !isOnGrid && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle size={14} />
                {roi.surplusEnergy} {unitLabel} {t("offgridWaste")}
              </p>
            )}
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT SIDE (Inputs) */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-muted)]">{t("setupName")}</label>

                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="input mt-1" placeholder={t("setupPlaceholder")} />
              </div>
              {/* Location */}
              <div className="relative z-20">
                <label className="text-sm text-[var(--text-muted)]">{t("enterPlace")}:</label>

                {/* INPUT ROW */}
                <div className="flex gap-2 relative">
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
                    placeholder={t("searchCity")}
                  />

                  {/* SEARCH BUTTON */}
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
                    className="mt-1 px-3 py-2 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.97] transition-all"
                  >
                    <Search size={16} />
                  </button>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-row md:flex-col gap-2 mt-2">
                  {/* GPS */}
                  <button
                    onClick={handleUseMyLocation}
                    className="
      flex-1 md:w-full
      text-xs sm:text-sm
      px-2 sm:px-3 md:px-2
      py-2 md:py-1.5
      rounded-lg
      border border-[var(--border)]
      hover:bg-[var(--border)]
      transition-all
      flex items-center justify-center gap-1 sm:gap-2
      whitespace-nowrap
    "
                  >
                    <LocateFixed size={16} />
                    <span className="hidden md:inline">{t("useMyLocation")}</span>
                  </button>

                  {/* MAP */}
                  <button
                    onClick={() => setShowMap((prev) => !prev)}
                    className="
      flex-1 md:w-full
      text-xs sm:text-sm
      px-2 sm:px-3 md:px-2
      py-2 md:py-1.5
      rounded-lg
      border border-[var(--border)]
      hover:bg-[var(--border)]
      transition-all
      flex items-center justify-center gap-1 sm:gap-2
      whitespace-nowrap
    "
                  >
                    <MapPin size={16} />
                    <span className="hidden md:inline">{t("pickFromMap")}</span>
                  </button>
                </div>

                {/* MAP DROPDOWN */}
                {showMap && (
                  <div className="absolute top-full left-0 w-full mt-2 z-50">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                      <div className="h-64">
                        <MapPicker setLat={setLat} setLon={setLon} setLocation={setLocation} onSelect={() => setShowMap(false)} />
                      </div>

                      <div className="p-2 text-xs text-[var(--text-muted)] text-center">{t("mapHint")}</div>
                    </div>
                  </div>
                )}

                {/* DROPDOWN */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-md z-10">
                    {suggestions.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setLocation(item.name);
                          setLat(item.lat);
                          setLon(item.lng); // FIXED (was wrong before in your code sometimes)
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
                <label className="text-sm text-[var(--text-muted)]">
                  {t("electricityRate")} ({currencySymbol}/{unitLabel})
                </label>
                <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="input mt-1" />
              </div>

              {/* Usage */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">
                  {t("monthlyUsage")} ({unitLabel} {t("or")} {t("units")})
                </label>
                <input type="number" value={usage} onChange={(e) => setUsage(Number(e.target.value))} className="input mt-1" />
              </div>

              {/* System Size */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">{t("systemSize")} (kW)</label>
                <input type="number" value={systemSize} onChange={(e) => setSystemSize(Number(e.target.value))} className="input mt-1" />
              </div>

              {/* System Cost */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">
                  {t("systemCost")} ({currencySymbol})
                </label>

                <input type="number" value={systemCost} onChange={(e) => setSystemCost(Number(e.target.value))} className="input mt-1" placeholder={t("costPlaceholder")} />

                <p className="text-xs text-[var(--text-muted)] mt-1">{t("costHint")}</p>
              </div>
            </div>

            {/* RIGHT SIDE (Sliders) */}
            <div className="space-y-6">
              {/* Azimuth */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">
                  {t("panelDirection")}: {azimuth}°
                </label>

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

                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {(() => {
                    const dir = getDirectionLabel(azimuth);

                    if (dir.includes("South")) return t("south");
                    if (dir.includes("North")) return t("north");
                    if (dir.includes("East")) return t("east");
                    if (dir.includes("West")) return t("west");

                    return dir;
                  })()}
                </p>
              </div>

              {/* Tilt */}
              <div>
                <label className="text-sm text-[var(--text-muted)]">
                  {t("panelTilt")}: {tiltAngle}°
                </label>

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
                {t("checkMetrics")}
              </button>
              <button
                onClick={() => {
                  setTiltAngle(optimalTiltValue);
                  setAzimuth(optimalAzimuthValue);
                }}
                className="
    w-full mt-2 px-4 py-2 rounded-lg
    border border-[var(--primary)]
    text-[var(--primary)]
    hover:bg-[var(--primary)] hover:text-white
    transition-all flex gap-2 justify-center items-center 
  "
              >
                <div>
                  <WandSparkles size={18} />
                </div>
                <div>{t("optimizeSetup")}</div>
              </button>

              <div className="text-xs text-[var(--text-muted)] mt-2 flex gap-2 justify-center items-center">
                <span>{improvementPercent > 0 ? `${t("improveOutput")} ~${improvementPercent}%` : t("alreadyOptimized")}</span>
                <Sparkles size={12} color="#f97316" />
              </div>
            </div>
          </div>
        </Card>

        {/* SAVED LOCATIONS */}
        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4 tracking-tight">{t("savedLocations")}</h2>
          {/* FILTER PILLS */}
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSortBy("savings")}
              className={`
      px-3 py-1 rounded-full text-xs border whitespace-nowrap transition-all duration-150
      ${sortBy === "savings" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
            >
              <span className="flex items-center gap-1">
                <IndianRupee size={14} />
                {t("sortSavings")}
              </span>
            </button>

            <button
              onClick={() => setSortBy("output")}
              className={`
      px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-all duration-150
      ${sortBy === "output" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
            >
              <span className="flex items-center gap-1">
                <Zap size={14} />
                {t("sortOutput")}
              </span>
            </button>

            <button
              onClick={() => setSortBy("payback")}
              className={`
      px-3 py-1 rounded-full text-xs border whitespace-nowrap transition-all duration-150
      ${sortBy === "payback" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
            >
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {t("sortPayback")}
              </span>
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-3">{t("rankedBy")}</p>
          {savedLocations.length === 0 && <p className="text-sm text-[var(--text-muted)]">{t("noSaved")}</p>}
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

                        {editingLoadingId === item.id && <p className="text-xs text-[var(--text-muted)]">{t("savingEdit")}</p>}

                        <p className="text-xs text-[var(--text-muted)]">
                          {item.systemSize} kW • {item.usage} {unitLabel} • {currencySymbol}
                          {item.rate}
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
                          {deletingId === item.id ? t("deleting") : t("delete")}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(item);
                          }}
                          className="text-xs text-blue-500 hover:underline ml-2 flex items-center gap-1 active:scale-[0.97] active:shadow-inner"
                        >
                          <GitCompare size={14} />
                          {compareList.find((i) => i.id === item.id) ? t("remove") : t("compare")}
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
            <h2 className="text-lg font-semibold mb-4 tracking-tight">{t("compareLocations")}</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">{t("basedOnSavings")}</p>
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
                  monthlyEnergy: monthlyAvg,
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
                reasons.push(`{ currencySymbol }${diffSavings}/month more savings`);
              }

              reason = reasons.join(" and ");

              return (
                <div className="grid grid-cols-2 gap-6">
                  <div className="mb-5 p-5 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm">
                    <p className="font-semibold text-green-700 flex items-center gap-2">
                      🏆 {better.name} {t("bestChoice")}
                    </p>

                    <p className="text-sm mt-1 text-green-700">
                      +{currencySymbol}
                      {t("monthlySavingsCompare").replace("{value}", diffSavings)} ({t("higherSavingsPercent").replace("{value}", percentBetter)})
                    </p>

                    <p className="text-xs text-[var(--text-muted)] mt-2">{reason || t("betterReason")}</p>
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

                          {isBest && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">{t("best")}</span>}
                        </div>

                        {/*COMPARE METRICS */}
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span>⚡ {t("output")}</span>
                            <span className={item.id === better.id ? "text-green-600 font-medium" : "text-red-500"}>
                              {monthlyAvg} {unitLabel}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>💰 {t("savings")}</span>
                            <span className={item.id === better.id ? "text-green-600 font-medium" : "text-red-500"}>
                              {currencySymbol}
                              {savings}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>📊 {t("coverage")}</span>
                            <span>{coverage}%</span>
                          </div>

                          <div className="flex justify-between">
                            <span>⏳ {t("sortPayback")}</span>
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
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6
    transition-all duration-500
    ${highlightMetrics ? "shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.01] brightness-[1.02]" : ""}
  `}
      >
        <Card className="transition-all duration-300  hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("directionEfficiency")}</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold">{Math.round(getDirectionEfficiency(azimuth) * 100)}%</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("monthlyOutput")}</p>
          {loading ? (
            <Skeleton className="w-20 h-8" />
          ) : (
            <h2 className="text-3xl font-semibold mt-1 tracking-tight">
              {monthlyAvg} {unitLabel}
            </h2>
          )}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("yearlyOutput")}</p>
          {loading ? (
            <Skeleton className="w-20 h-8" />
          ) : (
            <h2 className="text-3xl font-semibold mt-1 tracking-tight">
              {yearlyTotal} {unitLabel}
            </h2>
          )}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] tracking-tight">{t("optimalTilt")}</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{tilt}°</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("optimalDirection")}</p>
          {loading ? (
            <Skeleton className="w-20 h-8" />
          ) : (
            <h2 className="text-3xl font-semibold mt-1 tracking-tight">
              {(() => {
                const dir = getDirectionLabel(180);

                if (dir.includes("South")) return t("south");
                if (dir.includes("North")) return t("north");
                if (dir.includes("East")) return t("east");
                if (dir.includes("West")) return t("west");

                return dir;
              })()}{" "}
              (180°)
            </h2>
          )}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("usageCovered")}</p>
          {loading ? <Skeleton className="w-20 h-8" /> : <h2 className="text-3xl font-semibold mt-1 tracking-tight">{coverage}%</h2>}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("usedEnergy")}</p>
          {loading ? (
            <Skeleton className="w-20 h-8" />
          ) : (
            <h2 className="text-3xl font-semibold mt-1 tracking-tight">
              {roi.usedEnergy} {unitLabel}
            </h2>
          )}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("surplusEnergy")}</p>
          {loading ? (
            <Skeleton className="w-20 h-8" />
          ) : (
            <h2 className="text-3xl font-semibold mt-1 tracking-tight">
              {roi.surplusEnergy} {unitLabel}
            </h2>
          )}
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("monthlySavings")}</p>

          {loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="w-28 h-8" />
              <Skeleton className="w-24 h-4" />
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold mt-1 tracking-tight">
                {currencySymbol}
                {roi.monthlySavings}
              </h2>

              <p className="text-xs text-[var(--text-muted)] mt-1 text-green-500">
                {currencySymbol}
                {roi.monthlySavings * 12} {t("yearly")}
              </p>
            </>
          )}
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg">
          <p className="text-sm text-[var(--text-muted)] tracking-tight">{t("payback")}</p>

          {loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="w-28 h-8" />
              <Skeleton className="w-24 h-4" />
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold mt-1 tracking-tight">
                {roi.paybackYears} {t("years")}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                ~{roi.paybackMonths} {t("months")}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* CHART */}
      <Card className="transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg p-4 sm:p-6">
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDataMode("real")}
            className={`
      px-3 py-1 rounded-full text-xs border transition-all duration-150 whitespace-nowrap flex items-center gap-1
      ${dataMode === "real" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
          >
            <span className="flex items-center gap-1">
              <Sun size={14} />
              {t("realData")}
            </span>
          </button>

          <button
            onClick={() => setDataMode("estimated")}
            className={`
      px-3 py-1 rounded-full text-xs border transition-all duration-150 whitespace-nowrap flex items-center gap-1
      ${dataMode === "estimated" ? "bg-[var(--primary)] text-white hover:opacity-90" : "border-[var(--border)] active:scale-[0.97] active:shadow-inner"}
    `}
          >
            <span className="flex items-center gap-1">
              <BarChart3 size={14} />
              {t("estimated")}
            </span>
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-2">{dataMode === "real" ? t("realHint") : t("estimatedHint")}</p>
        <h2 className="text-base sm:text-lg font-semibold mb-4 tracking-tight">{t("solarProduction")}</h2>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-3">
          <p className="text-sm text-[var(--text-muted)]">
            {t("monthlyGeneration")} ({unitLabel})
          </p>

          <p className="text-sm font-medium">
            {yearlyTotal} {unitLabel}/year
          </p>
        </div>

        {loading ? (
          <Skeleton className="w-full h-64" />
        ) : (
          <div className="w-full">
            <div className="min-w-[300px]">
              <EnergyChart data={finalChartData} />
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-2 mb-3">
        {[10, 25, 50, 100].map((year) => (
          <button
            key={year}
            onClick={() => setYearsRange(year)}
            className={`
        px-3 py-1 rounded-full text-xs border transition-all duration-150 whitespace-nowrap flex items-center gap-1
        ${yearsRange === year ? "bg-[var(--primary)] text-white scale-[1.05]" : "border-[var(--border)] hover:opacity-90 active:scale-[0.97] active:shadow-inner"}
      `}
          >
            {year} yrs
          </button>
        ))}
      </div>

      <Card className="transition-all duration-300  hover:-translate-y-[2px] hover:shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("savingsOverTime")}</h2>
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
      <div className="flex justify-center items-center text-xs text-gray-600 mt-6">
        <span className="mr-1 gradient-text">Made by</span>
        <span className="font-medium text-gray-400 tracking-wide gradient-text">Ajay Danu</span>
      </div>
    </div>
  );
}
