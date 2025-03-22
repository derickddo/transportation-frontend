import React, { useState } from "react";
import LocationSearchDropdown from "./LocationSearchDropdown";
import { FaTruckMoving, FaSpinner, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // For animations

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const TripForm = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [cycleUsed, setCycleUsed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to parse location data into the required format
  const parseLocation = (location) => {
    if (!location) return null;

    // If location is already in the correct format
    if (
      typeof location === "object" &&
      location.name &&
      typeof location.latitude === "number" &&
      typeof location.longitude === "number"
    ) {
      return {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }

    // If location is an object with value, lat, and lng (common format for search components)
    if (
      typeof location === "object" &&
      location.value &&
      typeof location.lat === "number" &&
      typeof location.lng === "number"
    ) {
      return {
        name: location.value,
        latitude: location.lat,
        longitude: location.lng,
      };
    }

    // If location is an object with label and coordinates
    if (
      typeof location === "object" &&
      location.label &&
      location.coordinates &&
      typeof location.coordinates.lat === "number" &&
      typeof location.coordinates.lng === "number"
    ) {
      return {
        name: location.label,
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lng,
      };
    }

    // If location is a string in the format "Location Name (latitude, longitude)"
    if (typeof location === "string") {
      const match = location.match(/^(.*)\s*\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)$/);
      if (match) {
        return {
          name: match[1].trim(),
          latitude: parseFloat(match[2]),
          longitude: parseFloat(match[3]),
        };
      }
      // Fallback for string without coordinates
      return {
        name: location,
        latitude: null,
        longitude: null,
      };
    }

    // If the format is unrecognized, return null values for coordinates
    return {
      name: location.toString(),
      latitude: null,
      longitude: null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!pickup || !dropoff || !cycleUsed) {
      setError("Please fill in all fields.");
      return;
    }

    // Log the raw values for debugging
    console.log("Raw pickup:", pickup);
    console.log("Raw dropoff:", dropoff);

    // Parse the location data
    const parsedPickup = parseLocation(pickup);
    const parsedDropoff = parseLocation(dropoff);

    // Validate that coordinates are present
    if (!parsedPickup.latitude || !parsedPickup.longitude || !parsedDropoff.latitude || !parsedDropoff.longitude) {
      setError("Please select locations with valid coordinates.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_location: parsedPickup,
          dropoff_location: parsedDropoff,
          cycle_used: cycleUsed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/trip/${data.id}`);
      } else {
        setError("Error creating trip. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while creating the trip.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-lg w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <FaTruckMoving className="text-4xl text-blue-400 mr-3 animate-pulse" />
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Plan Your Trip
          </h2>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl flex items-center"
          >
            <FaExclamationCircle className="mr-3 text-red-400" />
            {error}
          </motion.div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <LocationSearchDropdown
            label="Current Location"
            onSelect={setCurrentLocation}
            placeholder="Enter current location"
          />
          <LocationSearchDropdown
            label="Pickup Location"
            onSelect={setPickup}
            placeholder="Enter pickup location"
          />
          <LocationSearchDropdown
            label="Dropoff Location"
            onSelect={setDropoff}
            placeholder="Enter dropoff location"
          />

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Current Cycle Used (hours)
            </label>
            <motion.input
              type="number"
              value={cycleUsed}
              onChange={(e) => setCycleUsed(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Enter hours"
              required
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full p-3 rounded-xl text-white font-semibold flex items-center justify-center transition-all duration-300 ${
              isLoading
                ? "bg-blue-600/50 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            }`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Creating Trip...
              </>
            ) : (
              "Create Trip"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default TripForm;