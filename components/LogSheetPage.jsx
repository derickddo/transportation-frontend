import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

// Log Sheet Component
const LogSheetPage = () => {
  const [tripData, setTripData] = useState(null);
  const [logEntries, setLogEntries] = useState([]); // State for log entries
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRefs = useRef([]); // Array of refs for each day's canvas
  const chartDrawn = useRef(false); // Track if the chart has been drawn
  const { tripId } = useParams();

  // Function to format time in HH:MM format
  const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Function to convert time to hours
  const timeToHours = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours + minutes / 60;
  };

  // Function to format duration in "Xh Ym" format
  const formatDuration = (start, end) => {
    const startHours = timeToHours(start);
    const endHours = timeToHours(end);
    const durationHours = endHours - startHours;
    const hours = Math.floor(durationHours);
    const minutes = Math.round((durationHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  // Parse the current_location string to extract the name
  const parseLocation = (locationString) => {
    if (!locationString) return "Unknown Location";
    const match = locationString.match(/^(.*)\s*\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)$/);
    return match ? match[1].trim() : locationString;
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

  // Function to build the timeline from route_instructions
  const buildTimeline = (routeInstructions) => {
    const timeline = [];
    let currentDay = 1;
    let dayTimeline = [];
    let currentTime = 0; // Start at 00:00 (in hours)

    routeInstructions.forEach((instruction, index) => {
      const durationHours = instruction.duration / 60; // Convert minutes to hours
      const startTime = formatTime(currentTime);
      const endTime = formatTime(currentTime + durationHours);

      // If the day changes, push the current dayTimeline and start a new one
      if (instruction.day !== currentDay) {
        // Fill the rest of the previous day with "Off Duty" if needed
        if (currentTime < 24) {
          dayTimeline.push({
            start: formatTime(currentTime),
            end: "24:00",
            status: "Off Duty",
            description: "End of the day",
            location: parseLocation(instruction.current_location),
          });
        }
        timeline.push(dayTimeline);
        dayTimeline = [];
        currentDay = instruction.day;
        currentTime = 0; // Reset time for the new day

        // Start the new day with "Off Duty" if the first instruction doesn't start at 00:00
        if (index > 0 && instruction.day > 1) {
          dayTimeline.push({
            start: "00:00",
            end: formatTime(currentTime),
            status: "Off Duty",
            description: "Start of the day",
            location: parseLocation(routeInstructions[index - 1].current_location),
          });
        }
      }

      // Add the current instruction to the timeline
      dayTimeline.push({
        start: startTime,
        end: endTime,
        status: mapHaltTypeToStatus(instruction.halt_type),
        description: instruction.description,
        location: parseLocation(instruction.current_location),
      });

      currentTime += durationHours;

      // If we've exceeded 24 hours, adjust the timeline
      if (currentTime >= 24 && index < routeInstructions.length - 1) {
        timeline.push(dayTimeline);
        dayTimeline = [];
        currentDay++;
        currentTime = 0;

        // Start the new day with "Off Duty" if needed
        if (index < routeInstructions.length - 1) {
          dayTimeline.push({
            start: "00:00",
            end: formatTime(currentTime),
            status: "Off Duty",
            description: "Start of the day",
            location: parseLocation(instruction.current_location),
          });
        }
      }
    });

    // Fill the rest of the last day with "Off Duty" if needed
    if (currentTime < 24) {
      dayTimeline.push({
        start: formatTime(currentTime),
        end: "24:00",
        status: "Off Duty",
        description: "End of the day",
        location: parseLocation(routeInstructions[routeInstructions.length - 1].current_location),
      });
    }

    timeline.push(dayTimeline);
    return timeline;
  };

  // Function to calculate total hours for each status
  const calculateTotalHours = (dayTimeline) => {
    const totals = {
      "Off Duty": 0,
      "Sleeper Berth": 0,
      "Driving": 0,
      "On Duty (not driving)": 0,
    };

    dayTimeline.forEach((entry) => {
      const start = timeToHours(entry.start);
      const end = timeToHours(entry.end);
      const duration = end - start;
      totals[entry.status] += duration;
    });

    return Object.fromEntries(
      Object.entries(totals).map(([status, hours]) => [
        status,
        formatTime(hours),
      ])
    );
  };

  // Function to convert time to a percentage for canvas positioning
  const timeToPercentage = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100; // Percentage of 24 hours
  };

  // Duty status colors (for canvas gradients)
  const statusColors = {
    "Off Duty": { start: "#f87171", end: "#dc2626" }, // Red gradient
    "Sleeper Berth": { start: "#60a5fa", end: "#2563eb" }, // Blue gradient
    "Driving": { start: "#facc15", end: "#ca8a04" }, // Yellow gradient
    "On Duty (not driving)": { start: "#fb923c", end: "#ea580c" }, // Orange gradient
  };

  // Animation variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.2 },
    }),
  };

  // Fetch trip data from the API
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        setError(null);
        chartDrawn.current = false; // Reset chart drawn state on new fetch

        const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId || 11}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch trip data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Trip data fetched:", data);
        setTripData(data);
      } catch (err) {
        console.error("Error fetching trip data:", err);
        setError("Failed to load trip data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  // Fetch log entries for the trip
  useEffect(() => {
    const fetchLogEntries = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/trips/${tripId}/log-entries`);
        if (!response.ok) {
          throw new Error(`Failed to fetch log entries: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Log entries fetched:", data);
        setLogEntries(data);
      } catch (err) {
        console.error("Error fetching log entries:", err);
        setError("Failed to load log entries. Please try again later.");
      }
    };

    if (tripId) {
      fetchLogEntries();
    }
  }, [tripId]);

  // Memoize the timeline calculation to prevent recalculating on every render
  const timeline = useMemo(() => {
    if (!tripData || !tripData.route_instructions || tripData.route_instructions.length === 0) return [];

    try {
      console.log("Building timeline from route_instructions...");
      const calculatedTimeline = buildTimeline(tripData.route_instructions);
      console.log("Timeline built:", calculatedTimeline);
      return calculatedTimeline;
    } catch (err) {
      console.error("Error in buildTimeline:", err);
      setError("Failed to build the timeline. Please try again.");
      return [];
    }
  }, [tripData]);

  // Initialize canvas refs for each day
  useEffect(() => {
    if (timeline && timeline.length > 0) {
      canvasRefs.current = timeline.map((_, i) => canvasRefs.current[i] || React.createRef());
    }
  }, [timeline]);

  // Draw the chart on the canvas for each day
  useEffect(() => {
    if (!timeline || timeline.length === 0 || chartDrawn.current) return;

    const drawChart = (dayTimeline, canvas, ctx, width, height, dpr, hoveredSegment = null) => {
      if (!canvas || width <= 0 || height <= 0) {
        console.warn("Invalid canvas dimensions:", width, height);
        return;
      }

      // Clear the canvas
      ctx.clearRect(0, 0, width, height);

      // Constants for layout
      const rowHeight = 40;
      const labelWidth = 120; // Width for status labels on the left
      const totalHoursWidth = 80; // Width for total hours on the right
      const chartWidth = width - labelWidth - totalHoursWidth;
      const chartX = labelWidth;
      const chartY = 30; // Space for time markers

      // Draw time markers (X-axis) and vertical grid lines
      ctx.font = "12px Arial";
      ctx.fillStyle = "#d1d5db"; // text-gray-200
      ctx.textAlign = "center"; // Center the text
      const verticalLinePositions = []; // Store positions of vertical lines
      for (let i = 0; i <= 24; i++) {
        const x = chartX + (i / 24) * chartWidth;
        verticalLinePositions.push(x);
        const label = i === 0 ? "Mid" : i === 12 ? "Noon" : i === 24 ? "24" : i;
        ctx.fillText(label, x, 20);

        // Draw vertical grid line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.moveTo(x, chartY);
        ctx.lineTo(x, chartY + 4 * rowHeight);
        ctx.stroke();
      }

      // Draw duty status rows
      const statuses = ["Off Duty", "Sleeper Berth", "Driving", "On Duty (not driving)"];
      const totals = calculateTotalHours(dayTimeline);
      const horizontalLinePositions = []; // Store positions of horizontal lines

      statuses.forEach((status, rowIndex) => {
        const y = chartY + rowIndex * rowHeight;
        horizontalLinePositions.push(y + rowHeight); // Store the y-position of the horizontal line

        // Draw horizontal line for each status row
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.moveTo(chartX, y + rowHeight);
        ctx.lineTo(chartX + chartWidth, y + rowHeight);
        ctx.stroke();

        // Draw midpoints between vertical lines
        for (let i = 0; i < 24; i++) {
          const startX = verticalLinePositions[i];
          const endX = verticalLinePositions[i + 1];
          const midX = startX + (endX - startX) / 2; // Calculate midpoint
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 1;
          ctx.moveTo(midX, y + rowHeight - 5);
          ctx.lineTo(midX, y + rowHeight + 5);
          ctx.stroke();
        }

        // Draw status label (left), aligned with the horizontal line
        ctx.textAlign = "left"; // Reset text alignment for labels
        ctx.fillStyle = "#d1d5db"; // text-gray-200
        ctx.fillText(status, 10, y + rowHeight - 5); // Align with the horizontal line

        // Draw total hours (right), aligned with the horizontal line
        ctx.textAlign = "right";
        ctx.fillText(totals[status], width - 10, y + rowHeight - 5);

        // Draw duty status lines
        ctx.textAlign = "center"; // Reset for other elements
        dayTimeline.forEach((entry, index) => {
          if (entry.status !== status) return;

          const startPercent = timeToPercentage(entry.start);
          const endPercent = timeToPercentage(entry.end);
          let startX = chartX + (startPercent / 100) * chartWidth;
          let endX = chartX + (endPercent / 100) * chartWidth;

          // Snap startX and endX to the nearest vertical line if they are close
          const startHour = timeToHours(entry.start);
          const endHour = timeToHours(entry.end);
          const startHourRounded = Math.round(startHour);
          const endHourRounded = Math.round(endHour);
          const snapThreshold = 0.1; // Snap if within 0.1 hours (6 minutes)

          if (Math.abs(startHour - startHourRounded) <= snapThreshold) {
            startX = verticalLinePositions[startHourRounded];
          }
          if (Math.abs(endHour - endHourRounded) <= snapThreshold) {
            endX = verticalLinePositions[endHourRounded];
          }

          // Draw horizontal line with gradient, exactly on the horizontal line
          const gradient = ctx.createLinearGradient(startX, y, endX, y);
          gradient.addColorStop(0, statusColors[status].start);
          gradient.addColorStop(1, statusColors[status].end);
          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.moveTo(startX, y + rowHeight); // Align exactly with the horizontal line
          ctx.lineTo(endX, y + rowHeight);
          ctx.stroke();

          // Draw vertical transition line (if not the first entry)
          if (index > 0) {
            // Snap the transition line to the nearest vertical grid line
            let transitionX = startX;
            const nearestVerticalLine = verticalLinePositions.reduce((prev, curr) =>
              Math.abs(curr - startX) < Math.abs(prev - startX) ? curr : prev
            );
            if (Math.abs(startX - nearestVerticalLine) < 5) { // Snap if within 5 pixels
              transitionX = nearestVerticalLine;
            }

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.moveTo(transitionX, y + rowHeight - 20);
            ctx.lineTo(transitionX, y + rowHeight);
            ctx.stroke();
          }

          // Draw break label (if applicable)
          const isBreak = entry.description && entry.description.includes("rest break");
          if (isBreak) {
            const breakLabel = `Break ${index}`;
            ctx.fillStyle = "#ffffff"; // text-white
            ctx.font = "10px Arial";
            ctx.fillText(breakLabel, startX, y - 10);

            // Draw arrow
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.moveTo(startX, y - 5);
            ctx.lineTo(startX - 4, y - 15);
            ctx.lineTo(startX + 4, y - 15);
            ctx.closePath();
            ctx.fill();
          }

          // Draw tooltip if this segment is hovered
          if (hoveredSegment && hoveredSegment.entry === entry && hoveredSegment.status === status) {
            const duration = formatDuration(entry.start, entry.end);
            const tooltipWidth = ctx.measureText(duration).width + 20;
            const tooltipHeight = 20;
            const tooltipX = startX + (endX - startX) / 2 - tooltipWidth / 2; // Center the tooltip
            const tooltipY = y - 30; // Position above the line

            // Draw tooltip background
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

            // Draw tooltip text
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText(duration, tooltipX + tooltipWidth / 2, tooltipY + 15);
          }
        });
      });
    };

    const resizeCanvases = () => {
      timeline.forEach((dayTimeline, dayIndex) => {
        const canvas = canvasRefs.current[dayIndex]?.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const parentWidth = canvas.parentElement.clientWidth; // Use parent width to ensure proper sizing
        const width = parentWidth > 0 ? parentWidth : 800; // Fallback width if parentWidth is 0
        const height = 200; // Fixed height

        // Set canvas dimensions with DPR for sharpness
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`; // Set CSS width
        canvas.style.height = `${height}px`; // Set CSS height
        ctx.scale(dpr, dpr);

        // Draw the chart
        drawChart(dayTimeline, canvas, ctx, width, height, dpr);

        // Add mousemove event listener for hover
        const handleMouseMove = (event) => {
          const rect = canvas.getBoundingClientRect();
          const mouseX = event.clientX - rect.left;
          const mouseY = event.clientY - rect.top;

          const rowHeight = 40;
          const labelWidth = 120;
          const totalHoursWidth = 80;
          const chartWidth = width - labelWidth - totalHoursWidth;
          const chartX = labelWidth;
          const chartY = 30;

          let hoveredSegment = null;

          const statuses = ["Off Duty", "Sleeper Berth", "Driving", "On Duty (not driving)"];
          statuses.forEach((status, rowIndex) => {
            const y = chartY + rowIndex * rowHeight;
            const lineY = y + rowHeight;

            if (Math.abs(mouseY - lineY) > 10) return;

            dayTimeline.forEach((entry) => {
              if (entry.status !== status) return;

              const startPercent = timeToPercentage(entry.start);
              const endPercent = timeToPercentage(entry.end);
              let startX = chartX + (startPercent / 100) * chartWidth;
              let endX = chartX + (endPercent / 100) * chartWidth;

              const startHour = timeToHours(entry.start);
              const endHour = timeToHours(entry.end);
              const startHourRounded = Math.round(startHour);
              const endHourRounded = Math.round(endHour);
              const snapThreshold = 0.1;
              const verticalLinePositions = [];
              for (let i = 0; i <= 24; i++) {
                verticalLinePositions.push(chartX + (i / 24) * chartWidth);
              }
              if (Math.abs(startHour - startHourRounded) <= snapThreshold) {
                startX = verticalLinePositions[startHourRounded];
              }
              if (Math.abs(endHour - endHourRounded) <= snapThreshold) {
                endX = verticalLinePositions[endHourRounded];
              }

              if (mouseX >= startX && mouseX <= endX) {
                hoveredSegment = { entry, status };
              }
            });
          });

          drawChart(dayTimeline, canvas, ctx, width, height, dpr, hoveredSegment);
        };

        // Add mouseleave event listener to clear the tooltip
        const handleMouseLeave = () => {
          drawChart(dayTimeline, canvas, ctx, width, height, dpr);
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        // Cleanup event listeners on unmount
        return () => {
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseleave", handleMouseLeave);
        };
      });
    };

    // Initial draw with a slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      resizeCanvases();
      chartDrawn.current = true; // Mark chart as drawn
    }, 100);

    // Add resize event listener to handle window resizing
    window.addEventListener("resize", resizeCanvases);

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resizeCanvases);
    };
  }, [timeline]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex">
        <Sidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex">
        <Sidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-red-400 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  if (!tripData || !timeline || timeline.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex">
        <Sidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-white text-xl">No log data available.</p>
        </div>
      </div>
    );
  }

  // Get the most recent log entry (if any)
  const latestLogEntry = logEntries.length > 0 ? logEntries[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 w-[80%] ml-65">
        {/* Header */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={0}
          className="bg-white/10 backdrop-blur-lg shadow-lg p-6 mb-8 rounded-xl border border-white/20"
        >
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Driver's Daily Log Sheet
          </h1>
          <p className="text-gray-200 mt-2">
            Trip ID: {tripData.id} | Distance: {tripData.distance.toFixed(1)} miles | Duration: {tripData.number_of_days} {tripData.number_of_days === 1 ? "day" : "days"}
          </p>
        </motion.header>

        {/* Log Sheet Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          custom={1}
          className="bg-white/10 backdrop-blur-lg shadow-lg rounded-xl p-6 border border-white/20"
        >
          {/* Trip Details */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">Trip Details</h2>
            <p className="text-gray-400 mt-2 text-sm">View the log sheet for this trip </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-200">
              <div className='bg-gradient-to-br from-gray-800 to-blue-900 p-4 rounded-lg border border-white/20'>
                <p className='mb-2'><strong>From:</strong> {tripData.pickup_location.address}</p>
                <p><strong>To:</strong> {tripData.dropoff_location.address}</p>
              </div>
              {latestLogEntry && (
                <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-2 text-white">
                  <div className="flex">
                    <span className="w-32 font-bold">Driver Name:</span>
                    <span>{latestLogEntry.driver_name}</span>
                  </div>
                  {latestLogEntry.load_number && (
                    <div className="flex">
                      <span className="w-32 font-bold">Load Number:</span>
                      <span>{latestLogEntry.load_number}</span>
                    </div>
                  )}
                  {latestLogEntry.carrier_name && (
                    <div className="flex">
                      <span className="w-32 font-bold">Carrier Name:</span>
                      <span>{latestLogEntry.carrier_name}</span>
                    </div>
                  )}
                  {latestLogEntry.truck_number && (
                    <div className="flex">
                      <span className="w-32 font-bold">Truck Number:</span>
                      <span>{latestLogEntry.truck_number}</span>
                    </div>
                  )}
                  {latestLogEntry.trailer_number && (
                    <div className="flex">
                      <span className="w-32 font-bold">Trailer Number:</span>
                      <span>{latestLogEntry.trailer_number}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Log Sheets for Each Day */}
          {timeline.map((dayTimeline, dayIndex) => {
            const totals = calculateTotalHours(dayTimeline);
            return (
              <motion.div
                key={dayIndex}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                custom={dayIndex + 2}
                className="mb-12"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Day {dayIndex + 1}</h3>

                {/* Summary of Total Hours */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(totals).map(([status, hours]) => (
                    <div
                      key={status}
                      className="bg-gradient-to-br from-gray-800 to-blue-900 p-4 rounded-lg border border-white/20"
                    >
                      <p className="text-sm font-medium text-gray-200">{status}</p>
                      <p className="text-lg font-semibold text-white">{hours}</p>
                    </div>
                  ))}
                </div>

                {/* Canvas Chart */}
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 w-full">
                  <canvas
                    ref={canvasRefs.current[dayIndex]}
                    className="w-full"
                    style={{ height: "200px" }}
                  />
                </div>

                {/* Remarks */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-white">Remarks</h4>
                  <ul className="text-sm text-gray-200 list-disc list-inside mt-2 space-y-2">
                    {dayTimeline
                      .filter((entry) => entry.location && entry.location !== "Unknown Location")
                      .map((entry, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                        >
                          {entry.start}: {entry.description} at {entry.location}
                        </motion.li>
                      ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default LogSheetPage;