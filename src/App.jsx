import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Results from './pages/Results';
import PlanDetails from './pages/PlanDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyItineraries from './pages/MyItineraries';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/plan-details" element={<PlanDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/my-itineraries" element={<MyItineraries />} />
      </Routes>
    </Router>
  );
}

export default App;
