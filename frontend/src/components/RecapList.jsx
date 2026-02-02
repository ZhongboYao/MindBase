import React from 'react';

const RecapList = ({ reminders }) => {
    return (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 shadow-xl h-full">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <span className="w-2 h-8 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500 block"></span>
                Today's Recaps
            </h2>

            {reminders.length === 0 ? (
                <div className="text-gray-500 text-center py-10">
                    <p>No recaps due today.</p>
                    <p className="text-sm mt-2 opacity-60">Great job staying on track!</p>
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar">
                    {reminders.map((item, index) => (
                        <div
                            key={index}
                            className="group p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 hover:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    Learned {item.date}
                                </span>
                                {/* Visual indicator for importance/streak could go here */}
                            </div>
                            <p className="text-gray-200 leading-relaxed group-hover:text-white transition-colors">
                                {item.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecapList;
