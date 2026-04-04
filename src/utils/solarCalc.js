const locationData = {
  Delhi: {
    latitude: 28.6,
    sunHours: [4.5, 5, 6, 6.5, 7, 7, 6.8, 6.5, 6, 5.5, 5, 4.5],
  },
  Mumbai: {
    latitude: 19.0,
    sunHours: [5.5, 6, 6.5, 7, 7.5, 6, 5, 5, 5.5, 6, 6, 5.5],
  },
  Jaipur: {
    latitude: 26.9,
    sunHours: [5, 5.5, 6.5, 7, 7.5, 7.5, 7, 6.5, 6, 5.5, 5, 4.5],
  },
};

export function getSunHoursFromLatitude(lat) {
  // Simple realistic approximation
  const base = 5.5;

  const variation = (Math.abs(lat) / 90) * 2;

  const avg = base - variation;

  return [avg - 1, avg - 0.5, avg, avg + 0.5, avg + 1, avg + 1, avg + 0.8, avg + 0.5, avg, avg - 0.5, avg - 0.8, avg - 1];
}

// The below code performs the ROI funtion
export function calculateAdvancedROI({ systemSize, rate, monthlyEnergy, usage, isOnGrid }) {
  const costPerKW = 50000;

  const totalCost = systemSize * costPerKW;

  const usedEnergy = Math.min(monthlyEnergy, usage);
  const surplusEnergy = Math.max(0, monthlyEnergy - usage);

  let effectiveEnergy;

  if (isOnGrid) {
    effectiveEnergy = monthlyEnergy; // full benefit
  } else {
    effectiveEnergy = usedEnergy; // surplus wasted
  }

  const monthlySavings = Math.round(effectiveEnergy * rate);

  const paybackMonths = Math.ceil(totalCost / monthlySavings);
  const paybackYears = (paybackMonths / 12).toFixed(1);

  return {
    totalCost,
    usedEnergy,
    surplusEnergy,
    monthlySavings,
    paybackMonths,
    paybackYears,
  };
}

// calculating energy on the basis of months/year
export function calculateMonthlyEnergy(systemSize = 1, lat = 28.6, azimuth = 180, tilt = 25) {
  const baseEfficiency = 0.75;

  const directionFactor = getDirectionEfficiency(azimuth);

  // Tilt factor (best near latitude)
  const optimalTilt = lat * 0.9;
  const tiltDiff = Math.abs(tilt - optimalTilt);
  const tiltFactor = Math.max(0.75, 1 - tiltDiff / 90);

  const efficiency = baseEfficiency * directionFactor * tiltFactor;

  const sunHours = getSunHoursFromLatitude(lat);

  return sunHours.map((hours, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    energy: Math.round(systemSize * hours * 30 * efficiency),
  }));
}

export function calculateYearlyTotal(data) {
  return data.reduce((sum, m) => sum + m.energy, 0);
}

export function calculateSavings(monthlyEnergy, rate) {
  return Math.round(monthlyEnergy * rate);
}

export function getOptimalTilt(lat = 28.6) {
  return Math.round(lat * 0.9);
}

export function getDirectionEfficiency(angle) {
  const optimal = 180;

  const diff = Math.abs(angle - optimal);

  // normalize (circular angle)
  const normalizedDiff = Math.min(diff, 360 - diff);

  // simple linear loss
  const efficiency = 1 - normalizedDiff / 360;

  return Math.max(0.7, efficiency); // minimum 70%
}

// Generates the graph for savings
export function generateSavingsData(monthlySavings, totalCost, years = 10) {
  const data = [];

  let total = 0;
  let breakEvenYear = null;

  for (let i = 1; i <= years; i++) {
    total += monthlySavings * 12;

    if (!breakEvenYear && total >= totalCost) {
      breakEvenYear = i;
    }

    data.push({
      year: `Year ${i}`,
      savings: total,
      isBreakEven: total >= totalCost && breakEvenYear === i,
    });
  }

  return data;
}

export function getDirectionLabel(angle) {
  if (angle >= 157 && angle <= 203) return "South (Best)";
  if (angle >= 112 && angle < 157) return "South-East";
  if (angle > 203 && angle <= 248) return "South-West";
  if (angle >= 67 && angle < 112) return "East";
  if (angle > 248 && angle <= 293) return "West";
  return "North";
}
