import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DailyPlan from './pages/DailyPlan';
import WeeklyPlan from './pages/WeeklyPlan';
import MonthlyPlan from './pages/MonthlyPlan';
import YearlyPlan from './pages/YearlyPlan';

function App() {
  // Data is now stored in backend (planning_data.json), not localStorage


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/daily" element={<DailyPlan />} />
        <Route path="/weekly" element={<WeeklyPlan />} />
        <Route path="/monthly" element={<MonthlyPlan />} />
        <Route path="/yearly" element={<YearlyPlan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
