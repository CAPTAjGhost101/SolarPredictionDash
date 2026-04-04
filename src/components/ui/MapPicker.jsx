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
function LocationMarker({ setLat, setLocation }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      setPosition(e.latlng);
      setLat(lat);

      // async inside
      reverseGeocode(lat, lng).then((name) => {
        if (name) {
          setLocation(name);
        }
      });
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function MapPicker({ setLat, setLocation }) {
  return (
    <MapContainer center={[28.6, 77.2]} zoom={5} style={{ height: "300px", width: "100%", borderRadius: "12px" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker setLat={setLat} setLocation={setLocation} />
    </MapContainer>
  );
}
