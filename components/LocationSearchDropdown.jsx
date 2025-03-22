import React, { useState, useEffect, useRef } from "react";
import { FaMapMarkerAlt, FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";

const LocationSearchDropdown = ({ label, onSelect, placeholder }) => {
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch locations with US restriction
  const fetchLocations = async (searchText) => {
    if (!searchText) {
      setLocations([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchText
        )}&format=json&countrycodes=us`
      );
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection
  const handleSelect = (location) => {
    setQuery(location.display_name);
    setShowDropdown(false);
    onSelect({
      name: location.display_name,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    });
  };

  // Handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
      <motion.div
        className="relative flex items-center p-3 bg-white/5 border border-white/20 rounded-xl shadow-md"
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <FaMapMarkerAlt className="text-blue-400 mr-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            fetchLocations(e.target.value);
          }}
          className="w-full bg-transparent text-gray-200 placeholder-gray-400 focus:outline-none"
          placeholder={placeholder}
        />
        {isLoading && <FaSpinner className="animate-spin text-blue-400 ml-2" />}
      </motion.div>

      {/* Dropdown */}
      {showDropdown && (
        <motion.ul
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute w-full bg-gray-500 backdrop-blur-lg border border-white/20 shadow-lg max-h-48 overflow-y-auto z-20 mt-2 rounded-xl custom-scrollbar"
        >
          {locations.length > 0 ? (
            locations.map((location, index) => (
              <motion.li
                key={index}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                className="p-3 text-gray-200 hover:text-white cursor-pointer flex items-center transition-colors duration-200"
                onClick={() => handleSelect(location)}
              >
                <FaMapMarkerAlt className="text-blue-400 mr-3" />
                {location.display_name}
              </motion.li>
            ))
          ) : (
            <li className="p-3 text-gray-400">No results found</li>
          )}
        </motion.ul>
      )}
    </div>
  );
};

export default LocationSearchDropdown;