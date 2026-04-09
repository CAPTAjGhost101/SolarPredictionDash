export async function searchLocations(query) {
  const API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
  const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${API_KEY}&limit=5`);

  const data = await res.json();

  return data.results.map((item) => ({
    name: item.formatted,
    lat: item.geometry.lat,
    lng: item.geometry.lng,
  }));
}

export async function reverseGeocode(lat, lng) {
  const API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
  const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${API_KEY}`);

  const data = await res.json();

  if (data.results.length === 0) return null;

  return data.results[0].formatted;
}
