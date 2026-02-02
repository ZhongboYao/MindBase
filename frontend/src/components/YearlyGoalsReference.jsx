import React, { useState, useEffect } from 'react';
import usePlanningStorage from '../hooks/usePlanningStorage';

const YearlyGoalsReference = ({ year }) => {
    const { data: allYearlyPlans } = usePlanningStorage('yearlyPlans');
    const [yearlyPlans, setYearlyPlans] = useState([]);

    useEffect(() => {
        // Filter plans for the specific year
        setYearlyPlans(allYearlyPlans.filter(p => p.date === year));
    }, [year, allYearlyPlans]);

    return (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-4 shadow-xl w-full max-h-[150px] flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 sticky top-0">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-purple-400 to-pink-500 block"></span>
                Yearly Goals {year}
            </h3>

            {yearlyPlans.length === 0 ? (
                <div className="text-xs text-gray-500 italic p-2 center">
                    No goals set for {year} yet.
                </div>
            ) : (
                <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
                    <div className="flex flex-col gap-1">
                        {yearlyPlans.map(plan => (
                            <div key={plan.id} className="flex items-start gap-2 py-1 px-1 rounded hover:bg-gray-800/30">
                                <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${plan.completed ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-blue-400'}`}></div>
                                <p className={`text-xs leading-relaxed break-words transition-colors ${plan.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                    {plan.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default YearlyGoalsReference;
