import React, { useState } from 'react';

const MonthStartCalendar = ({ currentDate, selectedMonth, selectedYear, onSelect, plans }) => {
    // We only need to show years and months
    const [viewYear, setViewYear] = useState(parseInt(selectedYear));

    const months = [
        { value: '01', label: 'Jan' },
        { value: '02', label: 'Feb' },
        { value: '03', label: 'Mar' },
        { value: '04', label: 'Apr' },
        { value: '05', label: 'May' },
        { value: '06', label: 'Jun' },
        { value: '07', label: 'Jul' },
        { value: '08', label: 'Aug' },
        { value: '09', label: 'Sep' },
        { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' },
        { value: '12', label: 'Dec' }
    ];

    // Get task efficiency for a month (0-1, where 1 is 100% complete)
    const getEfficiency = (monthValue, year) => {
        const key = `${year}-${monthValue}`;
        const monthPlans = plans.filter(p => p.date === key);

        if (monthPlans.length === 0) return null;

        const completed = monthPlans.filter(p => p.completed).length;
        return completed / monthPlans.length;
    };

    // Get background color based on efficiency (red -> orange -> green)
    const getEfficiencyColor = (efficiency) => {
        if (efficiency === null) return null;

        if (efficiency <= 0.5) {
            // Red to Orange (0% to 50%)
            const t = efficiency * 2; // 0 to 1
            const r = 255 + (255 - 255) * t;
            const g = 0 + (146 - 0) * t;
            const b = 0 + (0 - 0) * t;
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        } else {
            // Orange to North Blue (50% to 100%)
            const t = (efficiency - 0.5) * 2; // 0 to 1
            const r = 255 + (52 - 255) * t;
            const g = 146 + (216 - 146) * t;
            const b = 0 + (0 - 0) * t;
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => setViewYear(prev => prev - 1)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <h3 className="text-xl font-bold text-white">
                    {viewYear}
                </h3>

                <button
                    onClick={() => setViewYear(prev => prev + 1)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {months.map(m => {
                    const isSelected = viewYear.toString() === selectedYear && m.value === selectedMonth;
                    const isCurrent = viewYear === currentDate.getFullYear() && m.value === String(currentDate.getMonth() + 1).padStart(2, '0');
                    const efficiency = getEfficiency(m.value, viewYear);
                    const ledColor = getEfficiencyColor(efficiency);

                    // Style logic:
                    // Selected -> Grey (Focus)
                    // Current (not selected) -> Blue active style
                    // Default -> Transparent/Gray

                    let buttonClasses = "relative p-4 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all duration-200 ";

                    if (isSelected) {
                        buttonClasses += "bg-gray-800 shadow-lg ring-1 ";
                        if (isCurrent) {
                            buttonClasses += "border-north-blue text-north-blue ring-north-blue/50";
                        } else {
                            buttonClasses += "border-gray-500 text-white ring-gray-600";
                        }
                    } else if (isCurrent) {
                        buttonClasses += "bg-north-blue/10 border-north-blue text-north-blue";
                    } else {
                        buttonClasses += "bg-gray-800/40 border-gray-700/30 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-gray-200";
                    }

                    return (
                        <button
                            key={m.value}
                            onClick={() => onSelect(m.value, viewYear.toString())}
                            className={buttonClasses}
                        >
                            <span className="font-semibold text-lg">{m.label}</span>

                            {/* LED Indicator */}
                            {/* LED Indicator */}
                            <div
                                className={`w-1.5 h-1.5 rounded-full ${!ledColor ? 'bg-slate-600 shadow-[0_0_2px_rgba(71,85,105,0.4)]' : ''}`}
                                style={ledColor ? {
                                    backgroundColor: ledColor,
                                    boxShadow: `
                                        0 0 6px ${ledColor},
                                        0 0 4px ${ledColor},
                                        0 0 2px ${ledColor},
                                        inset 0 0 2px rgba(255,255,255,0.5)
                                    `
                                } : {}}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthStartCalendar;
