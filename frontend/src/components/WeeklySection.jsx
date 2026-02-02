import React, { useState } from 'react';

const WeeklySection = ({ weekStart, weekEnd, weekNumber, plans, onAddPlan, onTogglePlan, onDeletePlan, onEditPlan, onBreakdown }) => {
    const [newPlanContent, setNewPlanContent] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
    };

    const weekKey = `${weekStart}_${weekEnd}`;
    const weekPlans = plans.filter(p => p.weekKey === weekKey);

    const completedCount = weekPlans.filter(p => p.completed).length;
    const totalCount = weekPlans.length;
    const efficiency = totalCount > 0 ? completedCount / totalCount : null;

    const getEfficiencyColor = (eff) => {
        if (eff === null) return null;
        if (eff <= 0.5) {
            const t = eff * 2;
            const r = 255 + (255 - 255) * t;
            const g = 0 + (146 - 0) * t;
            const b = 0 + (0 - 0) * t;
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        } else {
            const t = (eff - 0.5) * 2;
            const r = 255 + (52 - 255) * t;
            const g = 146 + (216 - 146) * t;
            const b = 0 + (0 - 0) * t;
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
    };

    const ledColor = getEfficiencyColor(efficiency);

    const handleAdd = () => {
        if (newPlanContent.trim()) {
            onAddPlan({
                content: newPlanContent,
                weekKey: weekKey,
                weekStart: weekStart,
                weekEnd: weekEnd
            });
            setNewPlanContent('');
            setIsAdding(false);
        }
    };

    return (
        <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-north-blue">Week {weekNumber}</h3>
                    <p className="text-xs text-gray-500">{formatDateRange(weekStart, weekEnd)}</p>
                </div>

                <div className="flex items-center gap-3">
                    {efficiency !== null && (
                        <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                                backgroundColor: ledColor,
                                boxShadow: `0 0 6px ${ledColor}, 0 0 2px ${ledColor}`
                            }}
                        />
                    )}

                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        + Add
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {weekPlans.map(plan => (
                    <WeekPlanItem
                        key={plan.id}
                        plan={plan}
                        onToggle={onTogglePlan}
                        onDelete={onDeletePlan}
                        onEdit={onEditPlan}
                        onBreakdown={onBreakdown}
                    />
                ))}

                {isAdding && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 px-2 py-1 text-xs rounded bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-north-blue"
                            placeholder="New task..."
                            value={newPlanContent}
                            onChange={(e) => setNewPlanContent(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                            autoFocus
                        />
                        <button
                            onClick={handleAdd}
                            className="px-2 py-1 text-xs rounded bg-north-blue text-white hover:bg-blue-600"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewPlanContent('');
                            }}
                            className="px-2 py-1 text-xs rounded text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const WeekPlanItem = ({ plan, onToggle, onDelete, onEdit, onBreakdown }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(plan.content);
    const [isConfirming, setIsConfirming] = useState(false);

    if (isConfirming) {
        return (
            <div className="p-2 rounded bg-red-900/20 border border-red-700/50 flex items-center justify-between text-xs">
                <span className="text-red-400">Delete?</span>
                <div className="flex gap-1">
                    <button onClick={() => setIsConfirming(false)} className="px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700">No</button>
                    <button onClick={() => onDelete(plan.id)} className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white">Yes</button>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="p-2 rounded-lg border mb-2 transition-all duration-300 relative group flex gap-2 text-sm bg-gray-800/30 border-gray-700/30">
                <div className="flex-1">
                    <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs text-gray-200 focus:outline-none focus:border-orange-500 mb-1"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                onEdit(plan.id, editContent);
                                setIsEditing(false);
                            }
                        }}
                        autoFocus
                    />
                    <div className="flex gap-1 justify-end">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-1.5 py-0.5 text-[10px] rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onEdit(plan.id, editContent);
                                setIsEditing(false);
                            }}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="group flex items-center gap-3 py-1.5 transition-colors text-xs hover:bg-gray-800/30 rounded px-2">
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(plan.id, !plan.completed);
                }}
                className={`w-1.5 h-1.5 rounded-full shrink-0 cursor-pointer transition-colors ${plan.completed ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-blue-400 hover:bg-blue-300'}`}
            ></div>

            <div className="flex-1 min-w-0">
                <span className={`break-words transition-colors ${plan.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {plan.content}
                </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {onBreakdown && !plan.completed && (
                    <button onClick={() => onBreakdown(plan)} className="text-purple-400 hover:text-purple-300 p-0.5" title="Break down with AI">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>
                )}
                <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 p-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
                <button onClick={() => setIsConfirming(true)} className="text-red-400 hover:text-red-300 p-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default WeeklySection;
