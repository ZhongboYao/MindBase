import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Planning from '../components/Planning';
import MonthStartCalendar from '../components/MonthStartCalendar';
import TaskGroups from '../components/TaskGroups';
import WeeklySection from '../components/WeeklySection';
import YearlyGoalsReference from '../components/YearlyGoalsReference';
import usePlanningStorage from '../hooks/usePlanningStorage';

const MonthlyPlan = () => {
    // Current state for Month and Year
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

    // Derived date key for storage (YYYY-MM)
    const currentKey = `${selectedYear}-${selectedMonth}`;

    // Planning state (now stored in backend)
    const { data: plans, setData: setPlans } = usePlanningStorage('monthlyPlans');

    // Weekly plans state (now stored in backend)
    const { data: weeklyPlans, setData: setWeeklyPlans } = usePlanningStorage('weeklyPlans');

    // Daily plans state (for breakdown feature)
    const { data: dailyPlans, setData: setDailyPlans } = usePlanningStorage('dailyPlans');

    // Task groups from both monthly and yearly sources
    const { data: monthlyTaskGroups, setData: setMonthlyTaskGroups } = usePlanningStorage('monthlyTaskGroups');
    const { data: yearlyTaskGroups } = usePlanningStorage('yearlyTaskGroups');

    // Combine both task group sources
    const [taskGroups, setTaskGroups] = useState([]);

    useEffect(() => {
        setTaskGroups([...yearlyTaskGroups, ...monthlyTaskGroups]);
    }, [yearlyTaskGroups, monthlyTaskGroups]);

    // Breakdown modal state
    const [breakdownModal, setBreakdownModal] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [breakdownError, setBreakdownError] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [breakdownStep, setBreakdownStep] = useState('setup');
    const [editablePlan, setEditablePlan] = useState([]);
    const [breakdownType, setBreakdownType] = useState('monthly'); // 'monthly' or 'weekly'

    const availableModels = [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)', description: 'Best for quick planning' },
        { id: 'gpt-4o', name: 'GPT-4o (Balanced)', description: 'Good balance of speed and quality' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Powerful)', description: 'Most capable for complex tasks' }
    ];

    const monthlySections = []; // Empty as requested "No phases needed"

    // Planning management functions
    const handleAddPlan = ({ section, content, date }) => {
        const newPlan = {
            id: Date.now().toString(),
            section,
            content,
            date, // Here date is the YYYY-MM string
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

    // Handle AI-generated plans
    const handleAddAIPlans = (plansToAdd, taskName) => {
        const groupId = Date.now().toString();
        const planIds = [];

        // Add all plans
        const newPlans = plansToAdd.map(planData => {
            const newPlan = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                section: planData.section,
                content: planData.content,
                // Use returned date if valid YYYY-MM, otherwise fallback to current month
                date: (planData.date && /^\d{4}-\d{2}$/.test(planData.date)) ? planData.date : currentKey,
                completed: false,
                groupId: groupId // Link to task group
            };
            planIds.push(newPlan.id);
            return newPlan;
        });

        const updatedPlans = [...plans, ...newPlans];
        setPlans(updatedPlans);        // Create task group
        const newGroup = {
            id: groupId,
            taskName: taskName,
            planIds: planIds,
            createdAt: new Date().toISOString()
        };

        const updatedGroups = [...taskGroups, newGroup];
        setTaskGroups(updatedGroups);    };

    // Delete entire task group
    // Delete entire task group
    const handleDeleteTaskGroup = (groupId) => {
        // Find the group to get all plan IDs (if available in state)
        const group = taskGroups.find(g => g.id === groupId);

        if (group) {
            // Remove all plans in this group
            const updatedPlans = plans.filter(plan => !group.planIds.includes(plan.id));
            setPlans(updatedPlans);        }

        // Robust delete: Try removing from BOTH storages to handle legacy/stuck data or missing source
        let groupsChanged = false;

        // Remove from yearly task groups (if present)
        const yearlyGroups = yearlyTaskGroups;
        const updatedYearlyGroups = yearlyGroups.filter(g => g.id !== groupId);
        if (yearlyGroups.length !== updatedYearlyGroups.length) {            groupsChanged = true;
        }

        // Remove from monthly task groups (if present)
        const monthlyGroups = monthlyTaskGroups;
        const updatedMonthlyGroups = monthlyGroups.filter(g => g.id !== groupId);
        if (monthlyGroups.length !== updatedMonthlyGroups.length) {            groupsChanged = true;
        }

        // Update state with combined groups
        // We reload from the updated lists to be sure, or just filter current state
        if (groupsChanged || group) {
            setTaskGroups([...updatedYearlyGroups, ...updatedMonthlyGroups]);
        }
    };

    // Reload task groups when component mounts or when navigating back
    const reloadTaskGroups = () => {
        const monthlyGroups = monthlyTaskGroups;
        const yearlyGroups = yearlyTaskGroups;
        setTaskGroups([...yearlyGroups, ...monthlyGroups]);
    };

    // Use effect to sync task groups on component visibility
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                reloadTaskGroups();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', reloadTaskGroups);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', reloadTaskGroups);
        };
    }, []);

    const handleDateSelect = (month, year) => {
        setSelectedMonth(month);
        setSelectedYear(year);
    };

    // Weekly plan management functions
    const handleAddWeeklyPlan = ({ content, weekKey, weekStart, weekEnd }) => {
        const newPlan = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            content,
            weekKey,
            weekStart,
            weekEnd,
            completed: false
        };
        const updatedPlans = [...weeklyPlans, newPlan];
        setWeeklyPlans(updatedPlans);    };

    const handleToggleWeeklyPlan = (id, status) => {
        const updatedPlans = weeklyPlans.map(plan =>
            plan.id === id ? { ...plan, completed: status } : plan
        );
        setWeeklyPlans(updatedPlans);    };

    const handleDeleteWeeklyPlan = (id) => {
        const updatedPlans = weeklyPlans.filter(plan => plan.id !== id);
        setWeeklyPlans(updatedPlans);    };

    const handleEditWeeklyPlan = (id, newContent) => {
        const updatedPlans = weeklyPlans.map(plan =>
            plan.id === id ? { ...plan, content: newContent } : plan
        );
        setWeeklyPlans(updatedPlans);    };

    // Data Migration: Fix legacy timezone-shifted week keys
    // The previous implementation used toISOString() which shifted dates by -1 day in GMT+ zones.
    // e.g. "2026-01-31" (Sunday) instead of "2026-02-01" (Monday).
    // We detect if a weekStart is a Sunday and shift it to Monday.
    React.useEffect(() => {
        const hasLegacyData = weeklyPlans.some(plan => {
            const date = new Date(plan.weekStart);
            return date.getDay() === 0; // 0 is Sunday
        });

        if (hasLegacyData) {
            console.log("Migrating legacy weekly plans...");
            const updatedPlans = weeklyPlans.map(plan => {
                const startDate = new Date(plan.weekStart);
                if (startDate.getDay() === 0) { // If Sunday, shift +1 to Monday
                    startDate.setDate(startDate.getDate() + 1);

                    // Also fix weekEnd (if it was Saturday, shift to Sunday)
                    const endDate = new Date(plan.weekEnd);
                    endDate.setDate(endDate.getDate() + 1);

                    const newStart = startDate.toISOString().split('T')[0];
                    const newEnd = endDate.toISOString().split('T')[0];

                    return {
                        ...plan,
                        weekStart: newStart,
                        weekEnd: newEnd,
                        weekKey: `${newStart}_${newEnd}`
                    };
                }
                return plan;
            });
            setWeeklyPlans(updatedPlans);        }
    }, []); // Run once on mount

    // Calculate weeks for the selected month
    const getWeeksInMonth = () => {
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth) - 1; // 0-indexed

        // Helper to format date as YYYY-MM-DD using local time
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const weeks = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Start from the Monday of the week containing the first day
        let currentWeekStart = new Date(firstDay);
        const dayOfWeek = currentWeekStart.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
        currentWeekStart.setDate(currentWeekStart.getDate() + diff);

        let weekNumber = 1;

        while (currentWeekStart <= lastDay) {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

            // Check if this week overlaps with the current month
            const weekStartInMonth = currentWeekStart.getMonth() === month;
            const weekEndInMonth = weekEnd.getMonth() === month;

            if (weekStartInMonth || weekEndInMonth) {
                weeks.push({
                    weekNumber,
                    weekStart: formatDate(currentWeekStart),
                    weekEnd: formatDate(weekEnd)
                });
                weekNumber++;
            }

            // Move to next week
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }

        return weeks;
    };

    const weeksInMonth = getWeeksInMonth();

    const months = [
        { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
        { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
        { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];
    const currentMonthLabel = months.find(m => m.value === selectedMonth)?.label;

    // Breakdown feature handlers
    const handleBreakdownClick = (plan, type = 'monthly') => {
        setBreakdownModal(plan);
        setBreakdownType(type);
        setBreakdownStep('setup');
        setChatMessages([]);
        setUserInput('');
        setEditablePlan([]);
        setBreakdownError('');
    };

    const handleStartBreakdown = async () => {
        let initialMessage = '';

        if (breakdownType === 'weekly') {
            const start = breakdownModal.weekStart || currentKey + "-01";
            const end = breakdownModal.weekEnd || currentKey + "-28";
            initialMessage = `I need to break down this weekly task: "${breakdownModal.content}".
Period: ${start} to ${end}.
Please create a daily plan distributing the work across these days.`;
        } else {
            const weeks = getWeeksInMonth();
            const weeksInfo = weeks.map(w => `Week ${w.weekNumber}: ${w.weekStart} to ${w.weekEnd}`).join('\n');
            initialMessage = `I need to break down this monthly task: "${breakdownModal.content}".
The month is ${currentMonthLabel} ${selectedYear}.
It has ${weeks.length} weeks:
${weeksInfo}
Please create a weekly plan distibuting the work averagely across these weeks.`;
        }

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
            const endpoint = breakdownType === 'weekly' ? '/api/extract-daily-breakdown' : '/api/extract-weekly-breakdown';
            const body = {
                conversation: chatMessages,
                model: selectedModel,
                start_date: breakdownType === 'weekly' ? (breakdownModal.weekStart || currentKey + "-01") : currentKey + "-01",
                deadline: breakdownType === 'weekly' ? (breakdownModal.weekEnd || currentKey + "-28") : currentKey + "-28"
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to extract plan');
            }

            const data = await response.json();
            const editable = [];

            if (breakdownType === 'weekly') {
                data.plans.forEach(plan => {
                    // plan.date is YYYY-MM-DD
                    editable.push({
                        id: editable.length,
                        date: plan.date,
                        tasks: plan.tasks.map((t, i) => ({ id: `${plan.date}-${i}`, content: t, editing: false }))
                    });
                });
            } else {
                const weeks = getWeeksInMonth();
                data.plans.forEach(plan => {
                    const match = plan.date.toString().match(/Week (\d+)/i);
                    if (match) {
                        const weekNum = parseInt(match[1]);
                        const targetWeek = weeks[weekNum - 1];
                        if (targetWeek) {
                            editable.push({
                                id: editable.length,
                                date: plan.date,
                                weekInfo: targetWeek,
                                tasks: plan.tasks.map((t, i) => ({ id: `${plan.date}-${i}`, content: t, editing: false }))
                            });
                        }
                    }
                });
            }

            if (editable.length === 0) {
                throw new Error('No valid plans were generated. Please try again.');
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
        if (breakdownType === 'weekly') {
            const newTasks = [];
            editablePlan.forEach(plan => {
                plan.tasks.forEach(task => {
                    newTasks.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        section: 'whole_day',
                        content: task.content,
                        date: plan.date,
                        completed: false
                    });
                });
            });
            const updated = [...dailyPlans, ...newTasks];
            setDailyPlans(updated);            // Breakdown added to Daily Plan
        } else {
            const newPlans = [];
            editablePlan.forEach(plan => {
                if (plan.weekInfo) {
                    plan.tasks.forEach(task => {
                        newPlans.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            content: task.content,
                            weekKey: `${plan.weekInfo.weekStart}_${plan.weekInfo.weekEnd}`,
                            weekStart: plan.weekInfo.weekStart,
                            weekEnd: plan.weekInfo.weekEnd,
                            completed: false
                        });
                    });
                }
            });

            const updated = [...weeklyPlans, ...newPlans];
            setWeeklyPlans(updated);        }
        setBreakdownModal(null);
    };

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-8 font-sans">
            <div className="max-w-[2000px] mx-auto grid grid-cols-1 lg:grid-cols-6 gap-8 h-full">

                {/* Header */}
                <div className="lg:col-span-6 flex justify-between items-end border-b border-gray-800 pb-6 mb-2">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Link to="/" className="text-gray-500 hover:text-white transition-colors">
                                ← Back
                            </Link>
                        </div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-north-blue to-white bg-clip-text text-transparent">
                            Blue North Road
                        </h1>
                    </div>
                </div>

                {/* Left Column: Calendar Selection */}
                <div className="lg:col-span-1 lg:row-span-2 h-[600px] lg:h-auto flex flex-col">

                    <MonthStartCalendar
                        currentDate={now}
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onSelect={handleDateSelect}
                        plans={plans}
                    />

                    <div className="mt-6 flex-1 overflow-hidden min-h-0">
                        <TaskGroups
                            taskGroups={taskGroups}
                            onDeleteGroup={handleDeleteTaskGroup}
                            plans={plans}
                        />
                    </div>

                </div>

                {/* Yearly Goals Reference (Top Row Spanning) */}
                <div className="lg:col-span-5">
                    <YearlyGoalsReference year={selectedYear} />
                </div>

                {/* Middle Column: Monthly Plan */}
                <div className="lg:col-span-2 h-[550px]">
                    <Planning
                        title="Monthly Plan"
                        date={currentKey}
                        plans={plans}
                        onAddPlan={handleAddPlan}
                        onTogglePlan={handleTogglePlan}
                        onDeletePlan={handleDeletePlan}
                        onEditPlan={handleEditPlan}
                        onAddAIPlans={handleAddAIPlans}
                        customSections={monthlySections}
                        planType="monthly"
                        onBreakdown={handleBreakdownClick}
                        className="max-h-[550px]"
                    />
                </div>

                {/* Right Column: Weekly Plan */}
                <div className="lg:col-span-3 h-[550px]">
                    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 shadow-xl h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-8 rounded-full bg-gradient-to-b from-blue-400 to-cyan-500 block"></span>
                                Weekly Plan
                            </h2>
                        </div>
                        <div className="space-y-4 overflow-y-auto custom-scrollbar">
                            {weeksInMonth.map(week => (
                                <WeeklySection
                                    key={week.weekStart}
                                    weekNumber={week.weekNumber}
                                    weekStart={week.weekStart}
                                    weekEnd={week.weekEnd}
                                    plans={weeklyPlans}
                                    onAddPlan={handleAddWeeklyPlan}
                                    onTogglePlan={handleToggleWeeklyPlan}
                                    onDeletePlan={handleDeleteWeeklyPlan}
                                    onEditPlan={handleEditWeeklyPlan}
                                    onBreakdown={(plan) => handleBreakdownClick(plan, 'weekly')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Breakdown Modal */}
            {
                breakdownModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b border-gray-700">
                                <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Break Down into Weeks
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
                                        </div>
                                        <button onClick={handleStartBreakdown} disabled={isLoading} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition-all">Start Breaking Down</button>
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
                                                    <div className="animate-pulse text-gray-400 text-sm">Thinking...</div>
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
                                        <p className="text-gray-400 text-sm mb-4">Review and modify your weekly breakdown.</p>
                                        {editablePlan.map((plan, planIndex) => (
                                            <div key={plan.id} className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                                                <h4 className="text-xs font-semibold text-purple-400 mb-2">{plan.date} ({plan.weekInfo?.weekStart})</h4>
                                                <div className="space-y-2">
                                                    {plan.tasks.map((task) => (
                                                        <div key={task.id} className="text-xs text-gray-200">• {task.content}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex gap-2 pt-4">
                                            <button onClick={() => setBreakdownStep('chat')} className="flex-1 px-4 py-2 text-sm rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">Back to Chat</button>
                                            <button onClick={handleConfirmBreakdown} className="flex-1 px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all">
                                                {breakdownType === 'weekly' ? 'Add to Daily Plan' : 'Add to Weekly Plans'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {breakdownError && <div className="p-3 text-red-400 text-sm">{breakdownError}</div>}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MonthlyPlan;
