import React, { useState } from 'react';
import TripForm from '../components/TripForm';


const Home = () => {
  const [routeId, setRouteId] = useState(null);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Truck Route & ELD Planner</h1>
      <TripForm onRouteCreated={setRouteId} />
      {routeId && (
        <div className="mt-6 space-y-6">
          <RouteMap routeId={routeId} />
          <ELDLogSheet routeId={routeId} />
        </div>
      )}
    </div>
  );
};

export default Home;