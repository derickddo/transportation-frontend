import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import TripMap from "./TripMap";
import { motion } from "framer-motion"; // For animations
import { FaMapMarkerAlt, FaClock, FaRoute, FaInfoCircle, FaCalendarDay, FaTimes } from "react-icons/fa"; // For icons
import Sidebar from "./Sidebar"; // Import the Sidebar component


const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const TripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasLogEntry, setHasLogEntry] = useState(false); // New state to track if a log entry exists
  const [formData, setFormData] = useState({
    driverName: "",
    loadNumber: "",
    carrierName: "",
    truckNumber: "",
    trailerNumber: "",
    coDriverName: "",
    remarks: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`${API_URL}/api/trips/${tripId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Trip data:", data);
          setTrip(data);
        } else {
          console.error("Failed to fetch trip details.");
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
      }
    };

    const fetchLogEntries = async () => {
      try {
        const response = await fetch(`${API_URL}/api/trips/${tripId}/log-entries/`);
        if (response.ok) {
          const data = await response.json();
          console.log("Log entries:", data);
          // If the response contains at least one log entry, set hasLogEntry to true
          setHasLogEntry(data.length > 0);
        } else {
          console.error("Failed to fetch log entries.");
        }
      } catch (error) {
        console.error("Error fetching log entries:", error);
      }
    };

    fetchTrip();
    fetchLogEntries();
  }, [tripId]);

  // Parse the current_location string to extract name and coordinates
  const parseLocation = (locationString) => {
    if (!locationString) return { name: "Unknown", latitude: null, longitude: null };

    // Match the format "Location Name (latitude, longitude)"
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

  // Group route instructions by day
  const groupInstructionsByDay = (instructions) => {
    return instructions.reduce((acc, instruction) => {
      const day = instruction.day;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push({
        ...instruction,
        parsedLocation: parseLocation(instruction.current_location),
      });
      return acc;
    }, {});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate driver name
    if (!formData.driverName.trim()) {
      setFormError("Driver Name is required.");
      return;
    }

    setFormError("");

    // Prepare data to send to the backend
    const logEntryData = {
      trip: parseInt(tripId),
      driver_name: formData.driverName,
      load_number: formData.loadNumber || "",
      carrier_name: formData.carrierName || "",
      truck_number: formData.truckNumber || "",
      trailer_number: formData.trailerNumber || "",
    };

    try {
      console.log("Saving log entry:", logEntryData);
      // Send the log entry to the backend
      const response = await fetch(`${API_URL}/api/log-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logEntryData),
      });

      if (!response.ok) {
        throw new Error("Failed to save log entry.");
      }

      // Close the modal
      setIsModalOpen(false);

      // Redirect to LogSheetPage with the form data
      navigate(`/log-entry/${tripId}`, { state: { logEntry: logEntryData } });
    } catch (error) {
      console.error("Error saving log entry:", error);
      setFormError("Failed to save log entry. Please try again.");
    }
  };

  // Handle button click based on whether a log entry exists
  const handleButtonClick = () => {
    if (hasLogEntry) {
      navigate(`/log-entry/${tripId}`);
    } else {
      setIsModalOpen(true);
    }
  };

  if (!trip) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
        <Sidebar />
        <div className="flex-grow ml-72 flex items-center justify-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            className="text-xl font-semibold text-white"
          >
            Loading trip details...
          </motion.p>
        </div>
      </div>
    );
  }

  // Group instructions by day
  const instructionsByDay = groupInstructionsByDay(trip.route_instructions);

  // Prepare route points for the map (including intermediate stops)
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed w-full inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-white/20"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Create Log Entry</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            {formError && (
              <p className="text-red-400 text-sm mb-4">{formError}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Driver Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter driver name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Load Number
                </label>
                <input
                  type="text"
                  name="loadNumber"
                  value={formData.loadNumber}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter load number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Carrier Name
                </label>
                <input
                  type="text"
                  name="carrierName"
                  value={formData.carrierName}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter carrier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Truck Number
                </label>
                <input
                  type="text"
                  name="truckNumber"
                  value={formData.truckNumber}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter truck number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Trailer Number
                </label>
                <input
                  type="text"
                  name="trailerNumber"
                  value={formData.trailerNumber}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter trailer number"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <Sidebar />
      <div className="flex-grow ml-72 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-1 flex items-center">
                <FaRoute className="mr-3 text-blue-400" /> Trip Details
              </h2>
              <p className="text-gray-400 text-sm">
                View details of your trip and route instructions and visualize it on the map.
              </p>
            </div>
            <div>
              <button
                onClick={handleButtonClick}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                {hasLogEntry ? "View Log Entry" : "Create a Log Entry"}
              </button>
            </div>
          </div>

          {/* Map Section */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl overflow-hidden shadow-lg border border-white/20"
          >
            <TripMap
              pickup={trip.pickup_location}
              dropoff={trip.dropoff_location}
              routePoints={routePoints} // Pass the parsed route points for intermediate stops
            />
          </motion.div>

          {/* Trip Information Section */}
          <div className="mt-8">
            <h3 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-bold">
              Trip Info and Route Steps
            </h3>
            <p className="text-gray-400 text-sm">
              View detailed information about your trip and route steps below.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Info Card */}
            <div className="relative bg-gradient-to-br from-gray-800 to-blue-900 p-6 rounded-xl border border-white/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div
                className="absolute inset-0 border-2 border-transparent rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{ zIndex: -1 }}
              ></div>

              <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4 flex items-center">
                <FaInfoCircle className="mr-2 text-blue-400 animate-pulse" /> Trip Info
              </h3>
              <div className="space-y-3 text-gray-200 text-sm">
                {/* Route Path (Pickup to Dropoff) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="text-blue-400 shrink-0" />
                    <span className="font-medium">{trip.pickup_location.name}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="text-purple-400 shrink-0" />
                    <span className="font-medium">{trip.dropoff_location.name}</span>
                  </div>
                </div>

                {/* Distance, Cycle Used, and Number of Days */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FaRoute className="text-green-400 shrink-0" />
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
              </div>
            </div>

            {/* Route Instructions Section */}
            <div className="relative bg-gradient-to-br from-gray-800 to-blue-900 p-6 rounded-xl border border-white/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div
                className="absolute inset-0 border-2 border-transparent rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{ zIndex: -1 }}
              ></div>

              <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4 flex items-center">
                <FaRoute className="mr-2 text-blue-400 animate-pulse" /> Route Steps
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar text-gray-200 text-sm">
                {Object.keys(instructionsByDay).map((day) => (
                  <div key={day}>
                    <h4 className="text-lg font-medium text-blue-400 flex items-center">
                      <FaCalendarDay className="mr-2" /> Day {day}
                    </h4>
                    <ul className="space-y-3 mt-2">
                      {instructionsByDay[day].map((instruction, index) => (
                        <motion.li
                          key={`${day}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-start hover:text-white transition-colors duration-200"
                        >
                          <span className="w-6 h-6 bg-blue-500/20 rounded-full mr-3 flex items-center justify-center text-blue-400 font-medium text-xs shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{instruction.description}</p>
                            <p className="text-xs text-gray-400">
                              Location: {instruction.parsedLocation.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              Duration: {instruction.duration} min
                            </p>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TripDetails;