import React from "react";
import { Link } from "react-router-dom";
import { FaTruck, FaChartLine, FaRoute, FaMapMarkedAlt, FaStar } from "react-icons/fa";
import { motion } from "framer-motion"; // For animations

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex justify-center mb-6"
          >
            <FaTruck className="text-5xl text-yellow-300 animate-bounce" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4"
          >
            Streamline Your Logistics with Trip Manager
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-indigo-100 mb-8"
          >
            Plan, track, and optimize your trips with ease and efficiency.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link
              to="/trip-form"
              className="inline-block bg-yellow-300 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-yellow-400 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Start Planning
            </Link>
          </motion.div>
        </div>
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          <h2 className="text-2xl font-bold">Trip Manager</h2>
          <div className="space-x-4">
            <Link
              to="/trip-form"
              className="text-indigo-100 hover:text-yellow-300 transition-colors duration-300"
            >
              Create Trip
            </Link>
            <Link
              to="/dashboard"
              className="text-indigo-100 hover:text-yellow-300 transition-colors duration-300"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12"
        >
          Everything You Need for Trip Management
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start space-x-4"
          >
            <FaRoute className="text-3xl text-indigo-600 shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Route Planning</h3>
              <p className="text-gray-600">
                Generate optimized routes with stops and breaks tailored to your needs.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start space-x-4"
          >
            <FaMapMarkedAlt className="text-3xl text-indigo-600 shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Maps</h3>
              <p className="text-gray-600">
                Visualize your trips with clear, interactive maps and markers.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-start space-x-4"
          >
            <FaChartLine className="text-3xl text-indigo-600 shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Powerful Analytics</h3>
              <p className="text-gray-600">
                Gain insights into trip performance to make data-driven decisions.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-indigo-50 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12"
        >
          Trusted by Logistics Leaders
        </motion.h2>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600"
          >
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-lg" />
              ))}
            </div>
            <p className="text-gray-700 italic">
              "Trip Manager has revolutionized our logistics operations, saving us time and money!"
            </p>
            <span className="block mt-4 text-gray-900 font-semibold">
              — Sarah Johnson, Logistics Manager at TransCo
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600"
          >
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-lg" />
              ))}
            </div>
            <p className="text-gray-700 italic">
              "The analytics tools are a game-changer for our trip planning strategy."
            </p>
            <span className="block mt-4 text-gray-900 font-semibold">
              — Michael Lee, Operations Director at FleetX
            </span>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-4xl font-bold mb-6"
        >
          Ready to Transform Your Logistics?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-indigo-100 mb-8"
        >
          Join thousands of businesses optimizing their trips with Trip Manager.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            to="/trip-form"
            className="inline-block bg-yellow-300 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-yellow-400 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Get Started Today
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-center">
        <p>&copy; 2025 Trip Manager. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;