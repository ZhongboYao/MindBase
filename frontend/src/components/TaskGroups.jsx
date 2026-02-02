import React, { useState } from 'react';

const TaskGroups = ({ taskGroups, onDeleteGroup, plans = [] }) => {
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [confirmingDelete, setConfirmingDelete] = useState(null);

    // Create a Set of existing plan IDs for efficient lookup
    const existingPlanIds = new Set(plans.map(p => p.id));

    const toggleGroup = (groupId) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const handleDeleteClick = (e, groupId) => {
        e.stopPropagation();
        setConfirmingDelete(groupId);
    };

    const handleConfirmDelete = (e, groupId) => {
        e.stopPropagation();
        onDeleteGroup(groupId);
        setConfirmingDelete(null);
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setConfirmingDelete(null);
    };

    if (taskGroups.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-4 shadow-xl w-full h-full flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                AI Tasks
            </h3>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {taskGroups.map((group) => {
                    const activeCount = group.planIds.filter(id => existingPlanIds.has(id)).length;

                    // If no active tasks, we could visually indicate it (optional)

                    return (
                        <div key={group.id} className="bg-gray-800/40 rounded-lg border border-gray-700/50 overflow-hidden">
                            {confirmingDelete === group.id ? (
                                <div className="p-3 bg-red-900/20">
                                    <p className="text-red-400 text-xs mb-2">Delete all "{group.taskName}" tasks?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleCancelDelete(e)}
                                            className="flex-1 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={(e) => handleConfirmDelete(e, group.id)}
                                            className="flex-1 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800/60 transition-colors"
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className={`h-3 w-3 text-gray-400 transition-transform ${expandedGroups.has(group.id) ? 'rotate-90' : ''}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span className="text-xs text-gray-200 font-medium">{group.taskName}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeCount === 0 ? 'text-gray-600 bg-gray-800' : 'text-gray-500 bg-gray-700/50'}`}>
                                                {activeCount} / {group.planIds.length} items
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, group.id)}
                                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                            title="Delete all tasks in this group"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    {expandedGroups.has(group.id) && (
                                        <div className="px-3 pb-2 pt-1 border-t border-gray-700/50">
                                            <p className="text-[10px] text-gray-400 italic">
                                                Created: {new Date(group.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {activeCount} active tasks remaining from {group.planIds.length} generated
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskGroups;
