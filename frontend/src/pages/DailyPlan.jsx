import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import EntryForm from '../components/EntryForm';
import Sidebar from '../components/Sidebar';
import WeeklyPlanReference from '../components/WeeklyPlanReference';
import Planning from '../components/Planning';
import TaskGroups from '../components/TaskGroups';
import usePlanningStorage from '../hooks/usePlanningStorage';

function DailyPlan() {
    // Helper for local date string (YYYY-MM-DD)
    const getLocalTodayStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [currentDate, setCurrentDate] = useState(new Date());

    // Set default selected date to today (YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());

    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

    const [learnings, setLearnings] = useState([]);

    // Planning state (now stored in backend)
    const { data: plans, setData: setPlans, loading: plansLoading } = usePlanningStorage('dailyPlans');

    // Task groups state (now stored in backend)
    const { data: taskGroups, setData: setTaskGroups, loading: groupsLoading } = usePlanningStorage('taskGroups');

    // Fetch all learnings
    const fetchLearnings = async () => {
        try {
            const res = await fetch('/api/learnings');
            if (res.ok) {
                const data = await res.json();
                setLearnings(data);
            }
        } catch (error) {
            console.error("Failed to fetch learnings", error);
        }
    };

    // Helper to get reminders based on local data
    const getRemindersForDate = (dateStr) => {
        if (!dateStr) return [];
        const today = getLocalTodayStr();

        return learnings.filter(item => {
            if (!item.recap_dates || !Array.isArray(item.recap_dates)) return false;

            // Check if this specific date's recap is completed
            const completedDates = item.completed_dates || [];
            const isCompletedForDate = completedDates.includes(dateStr);

            // If we are looking at TODAY, show everything due today (regardless of status) OR in the past that is NOT completed for that date
            if (dateStr === today) {
                const isScheduledForToday = item.recap_dates.includes(dateStr);
                // Include overdue items only if they are NOT completed for their dates yet
                const hasOverdueIncomplete = item.recap_dates.some(d => d < dateStr && !(item.completed_dates || []).includes(d));
                return isScheduledForToday || hasOverdueIncomplete;
            }

            // Otherwise, just show what was specifically due on that date
            return item.recap_dates.includes(dateStr);
        }).map(item => ({
            ...item,
            // Add a completed flag for this specific date for UI convenience
            completed: (item.completed_dates || []).includes(dateStr)
        }));
    };

    // Helper to get items learned on a specific date
    const getLearnedItemsForDate = (dateStr) => {
        if (!dateStr) return [];
        return learnings.filter(item => item.date === dateStr);
    };

    // Breakdown Feature State
    const [breakdownModal, setBreakdownModal] = useState(null);
    const [breakdownStep, setBreakdownStep] = useState('setup');
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [breakdownError, setBreakdownError] = useState('');
    const [editableBreakdown, setEditableBreakdown] = useState([]);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

    // Breakdown Handlers
    const handleBreakdownClick = (plan) => {
        setBreakdownModal(plan);
        setBreakdownStep('setup');
        setChatMessages([]);
        setUserInput('');
        setEditableBreakdown([]);
        setBreakdownError('');
    };

    const handleStartBreakdown = async () => {
        const initialMessage = `I need to break down this daily task: "${breakdownModal.content}".
Date: ${selectedDate}.
Please create a detailed plan distributing the work across Morning, Afternoon, and Evening sections.`;

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
            const response = await fetch('/api/extract-daily-subtasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation: chatMessages,
                    start_date: selectedDate,
                    model: selectedModel
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to extract plan');
            }

            const data = await response.json();
            const editable = [];

            data.plans.forEach(plan => {
                editable.push({
                    id: editable.length,
                    section: plan.section,
                    tasks: plan.tasks.map((t, i) => ({ id: `${plan.section}-${i}`, content: t, editing: false }))
                });
            });

            if (editable.length === 0) {
                throw new Error('No valid plans were generated. Please try again.');
            }

            setEditableBreakdown(editable);
            setBreakdownStep('edit');
        } catch (error) {
            setBreakdownError(error.message || 'Failed to extract plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmBreakdown = () => {
        const newPlans = [];
        editableBreakdown.forEach(plan => {
            const normalizedSection = (plan.section || 'morning').toLowerCase().trim();
            const validSections = ['whole_day', 'morning', 'afternoon', 'evening'];
            const targetSection = validSections.includes(normalizedSection) ? normalizedSection : 'morning';

            plan.tasks.forEach(task => {
                newPlans.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    section: targetSection,
                    content: task.content,
                    date: selectedDate,
                    completed: false
                });
            });
        });

        const updated = [...plans, ...newPlans];
        setPlans(updated);
        setBreakdownModal(null);
    };

    useEffect(() => {
        fetchLearnings();
    }, []);

    const handleAddClick = (dateStr) => {
        setSelectedDate(dateStr);
        setIsEntryModalOpen(true);
    };

    const handleSaveLearning = async (data) => {
        try {
            const res = await fetch('/api/learnings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                fetchLearnings();
            }
        } catch (error) {
            console.error("Failed to save learning", error);
        }
    };
    const handleViewClick = (day) => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;

        setSelectedDate(dateStr);
    };



    const handleDeleteLearning = async (id) => {
        try {
            const res = await fetch(`/api/learnings/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setLearnings(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete learning", error);
        }
    };

    const handleToggleComplete = async (id, status, date = null) => {
        // Use selectedDate as the date if not provided
        const targetDate = date || selectedDate;

        try {
            const res = await fetch(`/api/learnings/${id}?completed=${status}&date=${targetDate}`, {
                method: 'PATCH',
            });
            if (res.ok) {
                // Refresh learnings to get updated completed_dates
                fetchLearnings();
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleMonthChange = (delta) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const handleEditLearning = async (id, newContent) => {
        try {
            const res = await fetch(`/api/learnings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent }),
            });
            if (res.ok) {
                setLearnings(prev => prev.map(item =>
                    item.id === id ? { ...item, content: newContent } : item
                ));
            }
        } catch (error) {
            console.error("Failed to update learning content", error);
        }
    };


    // Planning management functions
    const handleAddPlan = ({ section, content, date }) => {
        const newPlan = {
            id: Date.now().toString(),
            section,
            content,
            date,
            completed: false
        };
        const updatedPlans = [...plans, newPlan];
        setPlans(updatedPlans);
    };

    const handleTogglePlan = (id, status) => {
        const updatedPlans = plans.map(plan =>
            plan.id === id ? { ...plan, completed: status } : plan
        );
        setPlans(updatedPlans);
    };

    const handleDeletePlan = (id) => {
        const updatedPlans = plans.filter(plan => plan.id !== id);
        setPlans(updatedPlans);
    };

    const handleEditPlan = (id, newContent) => {
        const updatedPlans = plans.map(plan =>
            plan.id === id ? { ...plan, content: newContent } : plan
        );
        setPlans(updatedPlans);
    };

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
                date: planData.date,
                completed: false,
                groupId: groupId // Link to task group
            };
            planIds.push(newPlan.id);
            return newPlan;
        });

        const updatedPlans = [...plans, ...newPlans];
        setPlans(updatedPlans);

        // Create task group
        const newGroup = {
            id: groupId,
            taskName: taskName,
            planIds: planIds,
            createdAt: new Date().toISOString()
        };

        const updatedGroups = [...taskGroups, newGroup];
        setTaskGroups(updatedGroups);
    };

    // Delete entire task group
    const handleDeleteTaskGroup = (groupId) => {
        // Find the group to get all plan IDs
        const group = taskGroups.find(g => g.id === groupId);
        if (!group) return;

        // Remove all plans in this group
        const updatedPlans = plans.filter(plan => !group.planIds.includes(plan.id));
        setPlans(updatedPlans);

        // Remove the group
        const updatedGroups = taskGroups.filter(g => g.id !== groupId);
        setTaskGroups(updatedGroups);
    };

    // Derived state for stats
    const todayStr = getLocalTodayStr();
    const reviewsDueTodayCount = learnings.filter(item =>
        item.recap_dates &&
        item.recap_dates.some(date => {
            // Check if this recap date is today or before and not completed
            return date <= todayStr && !(item.completed_dates || []).includes(date);
        })
    ).length;

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-8 font-sans selection:bg-north-blue/30">
            <div className="max-w-[2000px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">

                {/* Helper Header */}
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
                            Track your daily learnings and never forget with spaced repetition.
                        </p>
                    </div>
                </div>

                {/* Calendar - 2 columns wide */}
                <div className="lg:col-span-2 space-y-6">
                    <CalendarView
                        currentDate={currentDate}
                        learnings={learnings}
                        onViewClick={handleViewClick}
                        selectedDate={selectedDate}
                        onMonthChange={handleMonthChange}
                        plans={plans}
                    />

                    {/* Task Groups */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-stretch">
                            <TaskGroups
                                taskGroups={taskGroups}
                                onDeleteGroup={handleDeleteTaskGroup}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Weekly Ref + (Sidebar | Planning) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="h-[180px]">
                        <WeeklyPlanReference selectedDate={selectedDate} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[550px]">
                        <div className="h-full">
                            <Sidebar
                                date={selectedDate}
                                recapItems={getRemindersForDate(selectedDate)}
                                learnedItems={getLearnedItemsForDate(selectedDate)}
                                onToggleComplete={handleToggleComplete}
                                onDelete={handleDeleteLearning}
                                onAddClick={handleAddClick}
                                onEdit={handleEditLearning}
                            />
                        </div>

                        <div className="h-full">
                            <Planning
                                date={selectedDate}
                                plans={plans}
                                onAddPlan={handleAddPlan}
                                onTogglePlan={handleTogglePlan}
                                onDeletePlan={handleDeletePlan}
                                onAddAIPlans={handleAddAIPlans}
                                onEditPlan={handleEditPlan}
                                onBreakdown={handleBreakdownClick}
                                className="max-h-[550px]"
                            />
                        </div>
                    </div>
                </div>

            </div>

            <EntryForm
                isOpen={isEntryModalOpen}
                onClose={() => setIsEntryModalOpen(false)}
                onSave={handleSaveLearning}
                selectedDate={selectedDate}
            />

            {/* Breakdown Modal */}
            {breakdownModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Break Down Task
                            </h3>
                            <button onClick={() => setBreakdownModal(null)} className="text-gray-500 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {breakdownStep === 'setup' && (
                                <div className="space-y-6">
                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                        <p className="text-sm text-gray-400 mb-2">Selected Task:</p>
                                        <p className="text-lg text-white font-medium">{breakdownModal.content}</p>
                                    </div>
                                    <p className="text-gray-300">
                                        I will help you break this down into smaller sub-tasks across your daily sections (Morning, Afternoon, Evening).
                                    </p>
                                    <button onClick={handleStartBreakdown} className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                        Start Breakdown with AI
                                    </button>
                                </div>
                            )}

                            {breakdownStep === 'chat' && (
                                <div className="space-y-4">
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
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Give feedback..." value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()} disabled={isLoading} />
                                        <button onClick={() => handleSendMessage()} disabled={isLoading || !userInput.trim()} className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">Send</button>
                                    </div>
                                    <button onClick={handleUsePlan} disabled={isLoading} className="w-full px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all">Create Plan</button>
                                    {breakdownError && <p className="text-red-400 text-sm mt-2">{breakdownError}</p>}
                                </div>
                            )}

                            {breakdownStep === 'edit' && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-sm mb-4">Review the breakdown:</p>
                                    {editableBreakdown.map((plan, i) => (
                                        <div key={i} className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                                            <h4 className="text-xs font-semibold text-purple-400 mb-2 uppercase">{plan.section}</h4>
                                            <div className="space-y-1">
                                                {plan.tasks.map(task => (
                                                    <div key={task.id} className="text-xs text-gray-200 bg-gray-900/50 p-1.5 rounded border border-gray-700/30">
                                                        {task.content}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleConfirmBreakdown} className="w-full px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all">Confirm & Add Tasks</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DailyPlan;
