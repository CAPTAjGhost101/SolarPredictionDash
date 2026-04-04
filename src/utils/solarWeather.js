export async function getSolarData(lat, lon) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2024-01-01&end_date=2024-12-31&daily=shortwave_radiation_sum&timezone=auto`;

  const res = await fetch(url);
  const data = await res.json();

  return data.daily.shortwave_radiation_sum; // array of daily values
}
