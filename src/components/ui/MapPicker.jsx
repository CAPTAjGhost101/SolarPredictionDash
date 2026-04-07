import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});
import { MapContainer, TileLayer, useMapEvents, Marker } from "react-leaflet";
import { useState } from "react";
import { reverseGeocode } from "../../utils/geoCode";
function LocationMarker({ setLat, setLon, setLocation, onSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      setPosition(e.latlng);
      setLat(lat);
      setLon(lng); // ✅ FIX: add longitude
      setLocation(`${lat.toFixed(2)}, ${lng.toFixed(2)}`); // instant feedback
      reverseGeocode(lat, lng).then((name) => {
        if (name) {
          setLocation(name);
        }
      });

      if (onSelect) onSelect(); // ✅ CLOSE MAP
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function MapPicker({ setLat, setLon, setLocation, onSelect }) {
  return (
    <MapContainer center={[28.6, 77.2]} zoom={5} style={{ height: "300px", width: "100%", borderRadius: "12px" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker setLat={setLat} setLon={setLon} setLocation={setLocation} onSelect={onSelect} />
    </MapContainer>
  );
}
