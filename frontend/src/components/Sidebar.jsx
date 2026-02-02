import React, { useState } from 'react';

// Component for items in "Learned Today" section (no checkbox)
const LearnedItem = ({ item, onDelete, onEdit }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(item.content);

    const handleSaveEdit = () => {
        onEdit(item.id, editContent);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-3 rounded-xl border mb-3 transition-all duration-300 relative group flex gap-3 bg-gray-800/40 border-gray-700/30">
                <div className="flex-1">
                    <textarea
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 focus:outline-none focus:border-north-blue resize-none mb-2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-2 py-1 text-xs rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            className="px-2 py-1 text-xs rounded-lg bg-north-blue text-white hover:bg-blue-600 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isConfirming) {
        return (
            <div className="p-3 rounded-xl bg-red-900/20 border border-red-700/50 flex items-center justify-between w-full animate-fade-in mb-3">
                <p className="text-red-400 text-sm font-medium">Delete item?</p>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirming(false);
                        }}
                        className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="py-1.5 mb-1 transition-all duration-300 relative group flex items-center gap-3 hover:bg-gray-800/30 px-2 rounded">
            {/* Note Dot (static) */}
            <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400"></div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 leading-relaxed break-words">
                    {item.content}
                </p>
            </div>

            {/* Actions (visible on hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-all p-0.5"
                    title="Edit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsConfirming(true);
                    }}
                    className="text-red-400 hover:text-red-300 transition-all p-0.5"
                    title="Delete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Component for items in "To Recap" section (with checkbox)
const LearningItem = ({ item, index, onToggleComplete }) => {
    return (
        <div className="py-1.5 mb-1 transition-all duration-300 relative group flex items-center gap-3 hover:bg-gray-800/30 px-2 rounded">
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(item.id, !item.completed);
                }}
                className={`w-1.5 h-1.5 rounded-full shrink-0 cursor-pointer transition-colors ${item.completed ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-blue-400 hover:bg-blue-300'}`}
            ></div>

            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed break-words transition-colors ${item.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {item.content}
                </p>
                {item.recap_dates && (
                    <span className="text-[10px] text-purple-400 mt-1 block">From {item.date}</span>
                )}
            </div>
        </div>
    );
};

const Sidebar = ({ date, recapItems, learnedItems, onToggleComplete, onDelete, onAddClick, onEdit }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Select a date';
        // Append time to ensure local date interpretation
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 shadow-xl h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <span className="w-2 h-8 rounded-full bg-gradient-to-b from-north-blue to-cyan-500 block"></span>
                {formatDate(date)}
            </h2>

            {/* Section 1: Learned Today */}
            <div className="mb-8 flex-1 overflow-y-auto max-h-[45%] custom-scrollbar">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Learned Today
                    </h3>
                    <button
                        onClick={() => onAddClick(date)}
                        className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
                        title="Add Learning"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {learnedItems.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Nothing learned on this day yet.</p>
                ) : (
                    <div>
                        {learnedItems.map((item, index) => (
                            <LearnedItem
                                key={item.id}
                                item={item}
                                onDelete={onDelete}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Section 2: Today's Recaps */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        To Recap
                    </h3>
                </div>

                {recapItems.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Nothing to recap on this day.</p>
                ) : (
                    <div>
                        {recapItems.map((item, index) => (
                            <LearningItem
                                key={item.id}
                                index={index}
                                item={item}
                                onToggleComplete={onToggleComplete}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Sidebar;
