import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api/' });

export const createRoute = (data) => api.post('calculate-route/', data);
export const getRouteMapData = (routeId) => api.get(`route/${routeId}/map-data/`);
export const generateELDLogs = (routeId) => api.get(`route/${routeId}/generate-eld-logs/`);