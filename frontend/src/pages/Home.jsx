import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-8 flex flex-col items-center justify-center font-sans selection:bg-north-blue/30">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-north-blue to-white bg-clip-text text-transparent mb-12">
                Blue North Road
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[90rem] w-full">
                <Link to="/yearly" className="group">
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center transition-all duration-300 hover:border-north-blue hover:bg-gray-900/60 hover:scale-[1.02] hover:shadow-2xl hover:shadow-north-blue/10 cursor-pointer">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-gray-100 group-hover:text-north-blue transition-colors">Yearly Plan</h2>
                            <p className="text-gray-400">Map out your long-term goals and milestones for the year.</p>
                        </div>
                    </div>
                </Link>

                <Link to="/monthly" className="group">
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center transition-all duration-300 hover:border-north-blue hover:bg-gray-900/60 hover:scale-[1.02] hover:shadow-2xl hover:shadow-north-blue/10 cursor-pointer">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-gray-100 group-hover:text-north-blue transition-colors">Monthly Plan</h2>
                            <p className="text-gray-400">Break down your yearly goals into monthly targets.</p>
                        </div>
                    </div>
                </Link>

                <Link to="/daily" className="group">
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center transition-all duration-300 hover:border-north-blue hover:bg-gray-900/60 hover:scale-[1.02] hover:shadow-2xl hover:shadow-north-blue/10 cursor-pointer">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-gray-100 group-hover:text-north-blue transition-colors">Daily Plan</h2>
                            <p className="text-gray-400">Manage daily tasks and spaced repetition learnings.</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Home;
