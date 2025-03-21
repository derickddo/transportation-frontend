import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TripForm from "../components/TripForm";
import TripDetails from "../components/TripDetails";
import Dashboard from "../components/Dashboard";
import LandingPage from "../components/LandingPage";
import LogSheetPage from "../components/LogSheetPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/trip-form" element={<TripForm />} />
        <Route path="/trip/:tripId" element={<TripDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/log-entry/:tripId" element={<LogSheetPage />} />
      </Routes>
    </Router>
  );
}

export default App;
