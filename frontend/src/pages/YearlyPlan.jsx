import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Planning from '../components/Planning';
import usePlanningStorage from '../hooks/usePlanningStorage';

const YearlyPlan = () => {
    // Current year state - default to current year
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
    const [showYearModal, setShowYearModal] = useState(false);
    const [newYearInput, setNewYearInput] = useState('');

    // List of active years (default to current year)
    const [activeYears, setActiveYears] = useState([new Date().getFullYear().toString()]);

    // Planning state (now stored in backend)
    const { data: plans, setData: setPlans } = usePlanningStorage('yearlyPlans');
    const { data: monthlyPlans, setData: setMonthlyPlans } = usePlanningStorage('monthlyPlans');
    const { data: yearlyTaskGroups, setData: setYearlyTaskGroups } = usePlanningStorage('yearlyTaskGroups');



    // Breakdown modal state
    const [breakdownModal, setBreakdownModal] = useState(null);
    const [breakdownDeadline, setBreakdownDeadline] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [breakdownError, setBreakdownError] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [breakdownStep, setBreakdownStep] = useState('setup');
    const [editablePlan, setEditablePlan] = useState([]);

    const availableModels = [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)', description: 'Best for quick planning' },
        { id: 'gpt-4o', name: 'GPT-4o (Balanced)', description: 'Good balance of speed and quality' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Powerful)', description: 'Most capable for complex tasks' }
    ];

    const yearlySections = [];

    // Planning management functions
    const handleAddPlan = ({ section, content, date }) => {
        const newPlan = {
            id: Date.now().toString(),
            section,
            content,
            date, // Here date is the year string
            completed: false
        };
        const updatedPlans = [...plans, newPlan];
        setPlans(updatedPlans);    };

    const handleTogglePlan = (id, status) => {
        const updatedPlans = plans.map(plan =>
            plan.id === id ? { ...plan, completed: status } : plan
        );
        setPlans(updatedPlans);    };

    const handleDeletePlan = (id) => {
        const updatedPlans = plans.filter(plan => plan.id !== id);
        setPlans(updatedPlans);    };

    const handleEditPlan = (id, newContent) => {
        const updatedPlans = plans.map(plan =>
            plan.id === id ? { ...plan, content: newContent } : plan
        );
        setPlans(updatedPlans);    };

    // Handle AI-generated plans from breakdown
    const handleAddAIPlans = (plansToAdd, taskName) => {
        const groupId = Date.now().toString();
        const planIds = [];

        // Add all plans to monthly storage
        const newPlans = plansToAdd.map(planData => {
            // Ensure date is in YYYY-MM format (handle both YYYY-MM and YYYY-MM-DD)
            let dateKey = planData.date;
            if (dateKey && dateKey.length > 7) {
                dateKey = dateKey.substring(0, 7); // Convert YYYY-MM-DD to YYYY-MM
            }

            const newPlan = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                section: planData.section || 'goals',
                content: planData.content,
                date: dateKey,
                completed: false,
                groupId: groupId,
                source: 'yearly_breakdown' // Track source
            };
            planIds.push(newPlan.id);
            return newPlan;
        });

        const updatedMonthlyPlans = [...monthlyPlans, ...newPlans];
        setMonthlyPlans(updatedMonthlyPlans);

        // Create task group
        const newGroup = {
            id: groupId,
            taskName: taskName,
            planIds: planIds,
            createdAt: new Date().toISOString(),
            source: 'yearly_breakdown'
        };

        // Add task group
        const updatedYearlyGroups = [...yearlyTaskGroups, newGroup];
        setYearlyTaskGroups(updatedYearlyGroups);
    };

    // Breakdown feature handlers
    const handleBreakdownClick = (plan) => {
        setBreakdownModal(plan);
        setBreakdownStep('setup');
        setBreakdownDeadline('');
        setChatMessages([]);
        setUserInput('');
        setEditablePlan([]);
        setBreakdownError('');
    };

    const handleStartBreakdown = async () => {
        if (!breakdownDeadline) {
            setBreakdownError('Please select a deadline');
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        const initialMessage = `Today's date is ${today}. I need to break down this yearly goal into monthly milestones: "${breakdownModal.content}". My deadline is ${breakdownDeadline}. Please help me create a month-by-month plan with key milestones and tasks for each month.`;
        await handleSendMessage(initialMessage);
        setBreakdownStep('chat');
    };

    const handleSendMessage = async (messageText = null) => {
        const text = messageText || userInput;
        if (!text.trim()) return;

        const newUserMessage = { role: 'user', content: text };
        const updatedMessages = [...chatMessages, newUserMessage];
        setChatMessages(updatedMessages);
        setUserInput('');
        setIsLoading(true);
        setBreakdownError('');

        try {
            const response = await fetch('/api/chat-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages, model: selectedModel })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to chat with AI');
            }

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.message };
            setChatMessages([...updatedMessages, assistantMessage]);
        } catch (error) {
            setBreakdownError(error.message || 'Failed to communicate with AI');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsePlan = async () => {
        setIsLoading(true);
        setBreakdownError('');

        try {
            const response = await fetch('/api/extract-monthly-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation: chatMessages,
                    start_date: `${currentYear}-01-01`,
                    deadline: breakdownDeadline,
                    model: selectedModel
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to extract plan');
            }

            const data = await response.json();

            // Group tasks by month for yearly breakdown
            const monthlyPlanMap = new Map();

            data.plans.forEach(plan => {
                if (!plan.date) {
                    console.warn('Plan missing date:', plan);
                    return;
                }

                // Extract year-month (YYYY-MM) from the date
                const monthKey = plan.date.substring(0, 7);

                if (!monthlyPlanMap.has(monthKey)) {
                    monthlyPlanMap.set(monthKey, {
                        id: monthlyPlanMap.size,
                        date: monthKey,
                        tasks: []
                    });
                }

                // Add tasks to this month
                if (plan.tasks && Array.isArray(plan.tasks)) {
                    plan.tasks.forEach(task => {
                        monthlyPlanMap.get(monthKey).tasks.push({
                            id: `${monthKey}-${monthlyPlanMap.get(monthKey).tasks.length}`,
                            content: task,
                            editing: false
                        });
                    });
                }
            });

            const editable = Array.from(monthlyPlanMap.values());

            if (editable.length === 0) {
                throw new Error('No valid monthly milestones were generated. Please try again.');
            }

            setEditablePlan(editable);
            setBreakdownStep('edit');
        } catch (error) {
            setBreakdownError(error.message || 'Failed to extract plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmBreakdown = () => {
        const plansToAdd = [];
        editablePlan.forEach(plan => {
            plan.tasks.forEach(task => {
                if (task.content.trim()) {
                    plansToAdd.push({
                        section: plan.section,
                        content: task.content,
                        date: plan.date
                    });
                }
            });
        });

        handleAddAIPlans(plansToAdd, breakdownModal.content);
        setBreakdownModal(null);
    };

    const handleAddYear = () => {
        if (newYearInput && !activeYears.includes(newYearInput)) {
            setActiveYears([...activeYears, newYearInput].sort());
            setCurrentYear(newYearInput);
            setNewYearInput('');
            setShowYearModal(false);
        }
    };

    // Calculate efficiency for LED indicator
    const getEfficiency = (year) => {
        const yearPlans = plans.filter(p => p.date === year);
        if (yearPlans.length === 0) return null;
        const completed = yearPlans.filter(p => p.completed).length;
        return completed / yearPlans.length;
    };

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
        <div className="min-h-screen bg-[#0f111a] text-white p-8 font-sans">
            <div className="max-w-[2000px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">

                {/* Header */}
                <div className="lg:col-span-4 flex justify-between items-end border-b border-gray-800 pb-6 mb-2">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Link to="/" className="text-gray-500 hover:text-white transition-colors">
                                ← Back
                            </Link>
                        </div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-north-blue to-white bg-clip-text text-transparent">
                            Blue North Road
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Set your high-level goals and milestones.
                        </p>
                    </div>
                </div>

                {/* Year Selection Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-300">Years</h3>
                        <button
                            onClick={() => setShowYearModal(true)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Add Year"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-2">
                        {activeYears.map(year => {
                            const efficiency = getEfficiency(year);
                            const ledColor = getEfficiencyColor(efficiency);
                            const isSelected = currentYear === year;
                            const isCurrent = new Date().getFullYear().toString() === year;

                            // Style logic:
                            // Selected -> Grey (Focus)
                            // Current (not selected) -> Blue active style
                            // Default -> Transparent/Gray

                            let buttonClasses = "w-full p-4 rounded-xl flex items-center justify-between transition-all duration-200 border ";

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
                                buttonClasses += "bg-gray-900/40 border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700";
                            }

                            return (
                                <button
                                    key={year}
                                    onClick={() => setCurrentYear(year)}
                                    className={buttonClasses}
                                >
                                    <span className="font-mono text-lg">{year}</span>
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

                {/* Planning Column */}
                <div className="lg:col-span-3">
                    <Planning
                        date={currentYear}
                        plans={plans}
                        onAddPlan={handleAddPlan}
                        onTogglePlan={handleTogglePlan}
                        onDeletePlan={handleDeletePlan}
                        onEditPlan={handleEditPlan}
                        customSections={yearlySections}
                        onBreakdown={handleBreakdownClick}
                    />
                </div>
            </div>

            {/* Add Year Modal */}
            {showYearModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">Add Year</h3>
                        <input
                            type="number"
                            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-north-blue mb-4"
                            placeholder="Enter year (e.g. 2027)"
                            value={newYearInput}
                            onChange={(e) => setNewYearInput(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowYearModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddYear}
                                disabled={!newYearInput}
                                className="px-4 py-2 rounded-lg bg-north-blue text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Breakdown Modal */}
            {breakdownModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Break Down into Months
                            </h3>
                            <button onClick={() => setBreakdownModal(null)} className="text-gray-500 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {breakdownStep === 'setup' && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-sm mb-4">Breaking down: <span className="text-white font-semibold">"{breakdownModal.content}"</span></p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
                                        <select
                                            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                        >
                                            {availableModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">{availableModels.find(m => m.id === selectedModel)?.description}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Deadline (Month)</label>
                                        <input type="month" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" value={breakdownDeadline} onChange={(e) => setBreakdownDeadline(e.target.value)} />
                                    </div>
                                    <button onClick={handleStartBreakdown} disabled={isLoading || !breakdownDeadline} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition-all">Start Breaking Down</button>
                                </div>
                            )}

                            {breakdownStep === 'chat' && (
                                <>
                                    <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {chatMessages.map((msg, index) => (
                                            <div key={index} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-purple-600/20 border border-purple-500/30 ml-4' : 'bg-gray-800/60 border border-gray-700/50 mr-4'}`}>
                                                <p className="text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="bg-gray-800/60 border border-gray-700/50 p-3 rounded-lg mr-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-pulse text-gray-400 text-sm">Thinking...</div>
                                                    <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="sticky bottom-0 bg-gray-900/50 backdrop-blur-sm pt-4 space-y-2">
                                        <div className="flex gap-2">
                                            <input type="text" className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ask questions or provide more details..." value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()} disabled={isLoading} />
                                            <button onClick={() => handleSendMessage()} disabled={isLoading || !userInput.trim()} className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">Send</button>
                                        </div>
                                        <button onClick={handleUsePlan} disabled={isLoading} className="w-full px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all">Use This Plan</button>
                                    </div>
                                </>
                            )}

                            {breakdownStep === 'edit' && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-sm mb-4">Review and modify your monthly breakdown before adding to calendar.</p>
                                    {editablePlan.map((plan, planIndex) => (
                                        <div key={plan.id} className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                                            <h4 className="text-xs font-semibold text-purple-400 mb-2">{plan.date.substring(0, 7)}</h4>
                                            <div className="space-y-2">
                                                {plan.tasks.map((task) => (
                                                    <div key={task.id} className="text-xs text-gray-200">• {task.content}</div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-4">
                                        <button onClick={() => setBreakdownStep('chat')} className="flex-1 px-4 py-2 text-sm rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">Back to Chat</button>
                                        <button onClick={handleConfirmBreakdown} className="flex-1 px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all">Add to Monthly Plans</button>
                                    </div>
                                </div>
                            )}

                            {breakdownError && (
                                <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 mt-4">
                                    <p className="text-red-400 text-sm">{breakdownError}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YearlyPlan;
