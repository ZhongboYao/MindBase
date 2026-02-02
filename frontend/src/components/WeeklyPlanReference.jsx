import React, { useState, useEffect } from 'react';
import usePlanningStorage from '../hooks/usePlanningStorage';

const WeeklyPlanReference = ({ selectedDate }) => {
    const { data: weeklyPlans } = usePlanningStorage('weeklyPlans');

    const getWeekStartMonday = (dateStr) => {
        if (!dateStr) return null;
        // Parse explicitly as Local Date (since MonthlyPlan uses Local Date initialized)
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(date);
        monday.setDate(date.getDate() + diff);

        // MonthlyPlan.jsx now uses local time YYYY-MM-DD for weekStart.
        // We must use the same formatting to match the stored keys.
        const yStr = monday.getFullYear();
        const mStr = String(monday.getMonth() + 1).padStart(2, '0');
        const dStr = String(monday.getDate()).padStart(2, '0');
        return `${yStr}-${mStr}-${dStr}`;
    };

    const getWeeklyPlansForDate = () => {
        if (!selectedDate) return [];
        const targetStart = getWeekStartMonday(selectedDate);
        if (!targetStart) return [];

        return weeklyPlans.filter(plan => plan.weekStart === targetStart);
    };

    const activePlans = getWeeklyPlansForDate();

    // Derive week label from first plan if available, or just calculate
    const weekLabel = activePlans.length > 0
        ? `Week of ${activePlans[0].weekStart}`
        : 'Weekly Plan';

    return (
        <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 h-full flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Current Week Goals
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[100px]">
                {activePlans.length === 0 ? (
                    <p className="text-gray-600 text-sm italic">No plans set for this week.</p>
                ) : (
                    <div className="space-y-2">
                        {activePlans.map(plan => (
                            <div key={plan.id} className="flex items-center gap-2 text-sm text-gray-300">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${plan.completed ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                                <span className={plan.completed ? 'text-gray-500 line-through' : ''}>{plan.content}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyPlanReference;
