import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { FaRoad, FaClock, FaList, FaChartPie, FaChartBar, FaMapMarkerAlt, FaRoute, FaCalendarDay } from "react-icons/fa";
import { motion } from "framer-motion"; // For animations
import Sidebar from "./Sidebar";
import Tooltip from "./Tooltip"; // Import the new Tooltip component
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

// Utility function to truncate text
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Utility function to parse location string
const parseLocation = (locationString) => {
  if (!locationString) return { name: "Unknown", latitude: null, longitude: null };
  const match = locationString.match(/^(.*)\s*\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      latitude: parseFloat(match[2]),
      longitude: parseFloat(match[3]),
    };
  }
  return { name: locationString, latitude: null, longitude: null };
};

// Map halt_type to duty status
const mapHaltTypeToStatus = (haltType) => {
  switch (haltType) {
    case "ON_DUTY_NOT_DRIVING":
    case "STOP":
      return "On Duty (not driving)";
    case "DRIVE":
      return "Driving";
    case "BREAK":
    case "OFF_DUTY":
      return "Off Duty";
    case "SLEEPER":
      return "Sleeper Berth";
    default:
      return "Off Duty";
  }
};

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalCycle, setTotalCycle] = useState(0);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/trips");
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setTrips(data);

          // Calculate metrics
          const distanceSum = data.reduce((sum, trip) => sum + trip.distance, 0);
          const cycleSum = data.reduce((sum, trip) => sum + trip.cycle_used, 0);

          setTotalDistance(distanceSum);
          setTotalCycle(cycleSum);
        } else {
          console.error("Failed to fetch trips.");
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };

    fetchTrips();
  }, []);

  // Calculate duty status breakdown for the first trip (if available)
  const dutyStatusData = trips.length > 0 ? (() => {
    const totals = {
      "Off Duty": 0,
      "Sleeper Berth": 0,
      "Driving": 0,
      "On Duty (not driving)": 0,
    };

    trips[0].route_instructions.forEach((instruction) => {
      const status = mapHaltTypeToStatus(instruction.halt_type);
      totals[status] += instruction.duration / 60; // Convert minutes to hours
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  })() : [];

  const COLORS = ["#f87171", "#60a5fa", "#facc15", "#fb923c"]; // Colors for duty statuses

  // Custom icons for map markers
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <Sidebar />
      <div className="flex-grow ml-65 p-6 sm:p-8 lg:p-12">
        {/* Header */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-1 flex items-center gap-3"
        >
          <FaChartPie className="text-blue-400" /> Trip Dashboard
        </motion.h2>
        <p className="text-gray-400 mb-8 text-sm">
          Welcome to the dashboard! Here you can view metrics, insights, and details about your trips.
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-center"
          >
            <FaList className="text-blue-400 text-3xl mb-3 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-200">Total Trips</h3>
            <p className="text-3xl font-bold text-white">{trips.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-center"
          >
            <FaRoad className="text-green-400 text-3xl mb-3 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-200">Total Distance</h3>
            <p className="text-3xl font-bold text-white">{totalDistance.toFixed(2)} miles</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-center"
          >
            <FaClock className="text-yellow-400 text-3xl mb-3 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-200">Total Cycle Used</h3>
            <p className="text-3xl font-bold text-white">{totalCycle} hours</p>
          </motion.div>
        </div>

        {/* Duty Status Breakdown (for single trip) */}
        {trips.length === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart: Duty Status Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20"
            >
              <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <FaChartBar className="text-blue-400" /> Duty Status Breakdown
              </h3>
              <div className="flex justify-center">
                <BarChart width={500} height={300} data={dutyStatusData}>
                  <XAxis dataKey="name" stroke="#D1D5DB" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#D1D5DB" tick={{ fontSize: 12 }} label={{ value: "Hours", angle: -90, position: "insideLeft", fill: "#D1D5DB" }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#D1D5DB", fontSize: "12px" }} />
                  <Bar dataKey="value" fill="#8884d8">
                    {dutyStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </div>
            </motion.div>

            {/* Pie Chart: Duty Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20"
            >
              <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <FaChartPie className="text-blue-400" /> Duty Status Distribution
              </h3>
              <div className="flex justify-center">
                <PieChart width={300} height={300}>
                  <Pie
                    data={dutyStatusData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#82ca9d"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: "#D1D5DB", strokeWidth: 1 }}
                  >
                    {dutyStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </div>
            </motion.div>
          </div>
        )}

        {/* Recent Trips Section */}
        <h3 className="text-2xl font-semibold text-gray-200 mb-1">Recent Trips</h3>
        <p className="text-gray-400 mb-4 text-sm">
          Here are the most recent trips you've taken. Click on a trip to view more details.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {trips.map((trip, index) => {
            // Prepare route points for the map
            const routePoints = trip.route_instructions
              .map((instruction) => {
                const { latitude, longitude } = parseLocation(instruction.current_location);
                if (latitude && longitude) {
                  return {
                    latitude,
                    longitude,
                    description: instruction.description,
                    halt_type: instruction.halt_type,
                    day: instruction.day,
                  };
                }
                return null;
              })
              .filter((point) => point !== null);

            const positions = [
              [trip.pickup_location.latitude, trip.pickup_location.longitude],
              ...routePoints.map((point) => [point.latitude, point.longitude]),
              [trip.dropoff_location.latitude, trip.dropoff_location.longitude],
            ];

            const bounds = positions.map((pos) => [pos[0], pos[1]]);

            return (
              <Link to={`/trip/${trip.id}`} key={trip.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(59, 130, 246, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  className="relative bg-gray-800 p-5 rounded-lg border border-gray-700 transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-400">
                      Trip {trip.id}
                    </h3>
                    <FaRoute className="text-blue-400 text-lg animate-pulse" />
                  </div>

                  {/* Map Preview */}
                  <div className="mb-4 rounded-lg overflow-hidden border border-white/20">
                    <MapContainer
                      bounds={bounds}
                      style={{ height: "150px", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[trip.pickup_location.latitude, trip.pickup_location.longitude]} icon={pickupIcon}>
                        <Popup>
                          <strong>Pickup:</strong> {trip.pickup_location.name}
                        </Popup>
                      </Marker>
                      <Marker position={[trip.dropoff_location.latitude, trip.dropoff_location.longitude]} icon={dropoffIcon}>
                        <Popup>
                          <strong>Dropoff:</strong> {trip.dropoff_location.name}
                        </Popup>
                      </Marker>
                      {routePoints.map((point, idx) => (
                        <Marker key={idx} position={[point.latitude, point.longitude]} icon={stopIcon}>
                          <Popup>
                            <strong>{point.description}</strong>
                            <br />
                            Day: {point.day}
                            <br />
                            Type: {point.halt_type}
                          </Popup>
                        </Marker>
                      ))}
                      <Polyline positions={positions} color="blue" />
                    </MapContainer>
                  </div>

                  {/* Card Content */}
                  <div className="space-y-2 text-gray-300 text-sm">
                    {/* Route Path (Pickup to Dropoff) */}
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-blue-400 shrink-0" />
                      <Tooltip text={trip.pickup_location.name}>
                        <span className="font-medium truncate max-w-[120px] inline-block">
                          {truncateText(trip.pickup_location.name, 20)}
                        </span>
                      </Tooltip>
                      <span className="text-gray-500">→</span>
                      <FaMapMarkerAlt className="text-blue-400 shrink-0" />
                      <Tooltip text={trip.dropoff_location.name}>
                        <span className="font-medium truncate max-w-[120px]">
                          {truncateText(trip.dropoff_location.name, 20)}
                        </span>
                      </Tooltip>
                    </div>

                    {/* Distance, Cycle Used, and Number of Days */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FaRoad className="text-green-400 shrink-0" />
                        <span>{trip.distance.toFixed(1)} miles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-yellow-400 shrink-0" />
                        <span>{trip.cycle_used} hr</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarDay className="text-orange-400 shrink-0" />
                        <span>{trip.number_of_days} {trip.number_of_days === 1 ? "day" : "days"}</span>
                      </div>
                    </div>

                    {/* Key Stops (Scrollable with Glassy Effect on Hover) */}
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-400 mb-1">Key Stops:</p>
                      <div
                        className="max-h-20 overflow-y-auto rounded-lg transition-all duration-300 
                        group-hover:bg-white/10 group-hover:backdrop-blur-md group-hover:border group-hover:border-white/20 
                        scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-700"
                      >
                        <ul className="text-xs text-gray-300 list-disc list-inside p-2">
                          {trip.route_instructions
                            .filter((instruction) => ["STOP", "BREAK", "SLEEPER"].includes(instruction.halt_type))
                            .map((instruction, idx) => (
                              <li key={idx} className="truncate">
                                Day {instruction.day}: {instruction.description} at {parseLocation(instruction.current_location).name}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;