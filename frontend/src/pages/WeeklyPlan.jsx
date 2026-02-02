import React from 'react';
import { Link } from 'react-router-dom';

const WeeklyPlan = () => {
    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-8 font-sans">
            <div className="max-w-[1200px] mx-auto">
                <Link to="/" className="text-gray-500 hover:text-white transition-colors mb-8 inline-block">
                    ← Back to Home
                </Link>
                <div className="flex flex-col items-center justify-center h-[80vh]">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-north-blue to-white bg-clip-text text-transparent mb-4">
                        Weekly Plan
                    </h1>
                    <p className="text-gray-400 text-xl">Coming soon...</p>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPlan;
