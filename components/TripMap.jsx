import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const TripMap = ({ pickup, dropoff, routePoints }) => {
  // Define positions for the map
  const positions = [
    [pickup.latitude, pickup.longitude], // Pickup
    ...routePoints.map((point) => [point.latitude, point.longitude]), // Intermediate points
    [dropoff.latitude, dropoff.longitude], // Dropoff
  ];

  // Calculate the bounds of the map to fit all points
  const bounds = positions.map((pos) => [pos[0], pos[1]]);

  // Custom icons for different types of markers
  const pickupIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  const dropoffIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  const stopIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: "400px", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Pickup Marker */}
      <Marker position={[pickup.latitude, pickup.longitude]} icon={pickupIcon}>
        <Popup>
          <strong>Pickup:</strong> {pickup.name}
        </Popup>
      </Marker>

      {/* Dropoff Marker */}
      <Marker position={[dropoff.latitude, dropoff.longitude]} icon={dropoffIcon}>
        <Popup>
          <strong>Dropoff:</strong> {dropoff.name}
        </Popup>
      </Marker>

      {/* Intermediate Stops */}
      {routePoints.map((point, index) => (
        <Marker
          key={index}
          position={[point.latitude, point.longitude]}
          icon={stopIcon}
        >
          <Popup>
            <strong>{point.description}</strong>
            <br />
            Day: {point.day}
            <br />
            Type: {point.halt_type}
          </Popup>
        </Marker>
      ))}

      {/* Polyline to connect the points */}
      <Polyline positions={positions} color="blue" />
    </MapContainer>
  );
};

export default TripMap;