import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaChartPie, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion"; // For animations

const Sidebar = () => {
  // Animation variants for list items
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, delay: i * 0.1 },
    }),
  };

  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 h-full w-65 bg-gradient-to-b from-gray-900 to-blue-900 text-white shadow-2xl z-40 border-r border-white/20"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Trip Manager
        </h2>
      </div>

      {/* Navigation Links */}
      <ul className="mt-6 space-y-3 p-4">
        <motion.li
          custom={0}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <Link
            to="/"
            className="flex items-center gap-3 p-3 text-gray-200 hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <FaHome className="text-blue-400" />
            <span>Home</span>
          </Link>
        </motion.li>
        <motion.li
          custom={1}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3 text-gray-200 hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <FaChartPie className="text-blue-400" />
            <span>Dashboard</span>
          </Link>
        </motion.li>
        <motion.li
          custom={2}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <Link
            to="/trip-form"
            className="flex items-center gap-3 p-3 text-gray-200 hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <FaPlus className="text-blue-400" />
            <span>Create Trip</span>
          </Link>
        </motion.li>
      </ul>
    </motion.div>
  );
};

export default Sidebar;