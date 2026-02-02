import React, { useState } from 'react';

const PlanItem = ({ item, onToggle, onDelete, onEdit, onBreakdown }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(item.content);

    const handleSaveEdit = () => {
        onEdit(item.id, editContent);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-2 rounded-lg border mb-2 transition-all duration-300 relative group flex gap-2 text-sm bg-gray-800/30 border-gray-700/30">
                <div className="flex-1">
                    <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs text-gray-200 focus:outline-none focus:border-orange-500 mb-1"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
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
                            onClick={handleSaveEdit}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
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
            <div className="p-2 rounded-lg bg-red-900/20 border border-red-700/50 flex items-center justify-between w-full animate-fade-in mb-2">
                <p className="text-red-400 text-xs font-medium">Delete?</p>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirming(false);
                        }}
                        className="px-2 py-0.5 text-xs rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 py-1.5 transition-all duration-200 relative group text-sm hover:bg-gray-800/30 rounded px-2">
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(item.id, !item.completed);
                }}
                className={`w-1.5 h-1.5 rounded-full shrink-0 cursor-pointer transition-colors ${item.completed ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-blue-400 hover:bg-blue-300'}`}
            ></div>

            <div className="flex-1 min-w-0">
                <p className={`text-xs break-words transition-colors ${item.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {item.content}
                </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                {onBreakdown && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBreakdown(item);
                        }}
                        className="text-purple-400 hover:text-purple-300 transition-all p-0.5"
                        title="Break Down"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>
                )}
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

const Planning = ({ date, plans, onAddPlan, onTogglePlan, onDeletePlan, onAddAIPlans, onEditPlan, customSections, onBreakdown, title = "Planning", planType = "daily", className = "" }) => {
    const [activeSection, setActiveSection] = useState(null);
    const [newPlanContent, setNewPlanContent] = useState('');

    // AI modal state
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiStep, setAiStep] = useState('chat');
    const [taskDescription, setTaskDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editablePlan, setEditablePlan] = useState([]);
    const [aiError, setAiError] = useState('');

    const availableModels = [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)', description: 'Best for quick planning' },
        { id: 'gpt-4o', name: 'GPT-4o (Balanced)', description: 'Good balance of speed and quality' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Powerful)', description: 'Most capable for complex tasks' }
    ];

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Select a date';
        // Check if it's "Week X"
        if (typeof dateStr === 'string' && dateStr.toLowerCase().startsWith('week')) return dateStr;
        // Check if it's just a year
        if (/^\d{4}$/.test(dateStr)) return dateStr;

        const d = new Date(dateStr);
        return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    // ... (sections definition logic omitted, remains same)

    const sections = customSections || [
        { id: 'whole_day', label: '📅 Whole Day', icon: '📅' },
        { id: 'morning', label: '🌅 Morning', icon: '☀️' },
        { id: 'afternoon', label: '☀️ Afternoon', icon: '🌤️' },
        { id: 'evening', label: '🌙 Evening', icon: '🌙' }
    ];

    const handleAddPlan = (section) => {
        if (newPlanContent.trim()) {
            onAddPlan({ section, content: newPlanContent, date });
            setNewPlanContent('');
            setActiveSection(null);
        }
    };

    const handleResetAI = () => {
        setAiStep('chat');
        setChatMessages([]);
        setTaskDescription('');
        setDeadline('');
        setUserInput('');
        setEditablePlan([]);
        setAiError('');
    };

    const handleSendInitialMessage = async () => {
        if (!taskDescription.trim() || !deadline) {
            setAiError('Please provide both task description and deadline');
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        const initialMessage = `Today's date is ${today}. I need help planning: ${taskDescription}. My deadline is ${deadline}.`;
        await handleSendMessage(initialMessage);
    };

    const handleSendMessage = async (messageText = null) => {
        const text = messageText || userInput;
        if (!text.trim()) return;

        const newUserMessage = { role: 'user', content: text };
        const updatedMessages = [...chatMessages, newUserMessage];
        setChatMessages(updatedMessages);
        setUserInput('');
        setIsLoading(true);
        setAiError('');

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
            setAiError(error.message || 'Failed to communicate with AI');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsePlan = async () => {
        setIsLoading(true);
        setAiError('');

        try {
            // If date is YYYY-MM (Monthly Plan), append -01 to make it a valid date for the backend
            const startDate = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;

            let endpoint = '/api/extract-plan';
            if (planType === 'monthly') endpoint = '/api/extract-monthly-goals';
            // if (planType === 'yearly') endpoint = '/api/extract-monthly-plan'; // Optional, keeping simple for now

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation: chatMessages,
                    start_date: startDate,
                    deadline: deadline,
                    model: selectedModel
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to extract plan');
            }

            const data = await response.json();
            const editable = data.plans.map((plan, index) => ({
                id: index,
                date: plan.date,
                section: plan.section,
                tasks: plan.tasks.map((task, taskIndex) => ({
                    id: `${index} -${taskIndex} `,
                    content: task,
                    editing: false
                }))
            }));
            setEditablePlan(editable);
            setAiStep('edit');
        } catch (error) {
            setAiError(error.message || 'Failed to extract plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditTask = (planIndex, taskId, newContent) => {
        const updated = [...editablePlan];
        const taskIndex = updated[planIndex].tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            updated[planIndex].tasks[taskIndex].content = newContent;
            setEditablePlan(updated);
        }
    };

    const handleRemoveTask = (planIndex, taskId) => {
        const updated = [...editablePlan];
        updated[planIndex].tasks = updated[planIndex].tasks.filter(t => t.id !== taskId);
        setEditablePlan(updated);
    };

    const handleAddTaskToPlan = (planIndex) => {
        const updated = [...editablePlan];
        updated[planIndex].tasks.push({
            id: `${planIndex} -${Date.now()} `,
            content: '',
            editing: true
        });
        setEditablePlan(updated);
    };

    const handleConfirmPlan = () => {
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

        onAddAIPlans(plansToAdd, taskDescription);
        setShowAiModal(false);
        handleResetAI();
    };

    return (
        <div className={`bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 shadow-xl h-full flex flex-col overflow-hidden ${className}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-8 rounded-full bg-gradient-to-b from-orange-400 to-amber-500 block"></span>
                    {title}
                </h2>
                {onAddAIPlans && (
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/20 flex items-center gap-1"
                        title="AI Planning Assistant"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Plan
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                {sections.length === 0 ? (
                    // Single list view for Yearly Plan when no sections defined
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                Goals
                            </h3>
                            <button
                                onClick={() => setActiveSection(activeSection === 'goals' ? null : 'goals')}
                                className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
                                title="Add Goal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {activeSection === 'goals' && (
                            <div className="mb-2 flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Enter goal..."
                                    value={newPlanContent}
                                    onChange={(e) => setNewPlanContent(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddPlan('goals')}
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleAddPlan('goals')}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        <div className="space-y-1">
                            {plans.filter(p => p.date === date).length === 0 ? (
                                <p className="text-gray-600 text-xs italic">No goals yet</p>
                            ) : (
                                plans.filter(p => p.date === date).map((plan) => (
                                    <PlanItem
                                        key={plan.id}
                                        item={plan}
                                        onToggle={onTogglePlan}
                                        onDelete={onDeletePlan}
                                        onEdit={onEditPlan}
                                        onBreakdown={onBreakdown}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    sections.map((section) => {
                        const sectionPlans = plans.filter(p => p.section === section.id && p.date === date);

                        return (
                            <div key={section.id} className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <span>{section.icon}</span>
                                        {section.id}
                                    </h3>
                                    <button
                                        onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                                        className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
                                        title="Add Plan"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                {activeSection === section.id && (
                                    <div className="mb-2 flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Enter plan..."
                                            value={newPlanContent}
                                            onChange={(e) => setNewPlanContent(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddPlan(section.id)}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleAddPlan(section.id)}
                                            className="px-3 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {sectionPlans.length === 0 ? (
                                        <p className="text-gray-600 text-xs italic">No plans yet</p>
                                    ) : (
                                        sectionPlans.map((plan) => (
                                            <PlanItem
                                                key={plan.id}
                                                item={plan}
                                                onToggle={onTogglePlan}
                                                onDelete={onDeletePlan}
                                                onEdit={onEditPlan}
                                                onBreakdown={section.id === 'whole_day' ? onBreakdown : undefined}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* AI Modal */}
            {
                showAiModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b border-gray-700">
                                <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    AI Planning Assistant
                                </h3>
                                <button onClick={() => setShowAiModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {aiStep === 'chat' && (
                                    <div className="space-y-4">
                                        {chatMessages.length === 0 ? (
                                            <>
                                                <p className="text-gray-400 text-sm mb-4">Describe what you want to accomplish and your deadline. I'll help you create a detailed plan!</p>
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
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">What do you want to accomplish?</label>
                                                    <textarea className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" rows="3" placeholder="e.g., Learn to play chess" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
                                                    <input type="date" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={date} />
                                                </div>
                                                <button onClick={handleSendInitialMessage} disabled={isLoading || !taskDescription || !deadline} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition-all">Start Planning</button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                                    {chatMessages.map((msg, index) => (
                                                        <div key={index} className={`p - 3 rounded - lg text - sm ${msg.role === 'user' ? 'bg-purple-600/20 border border-purple-500/30 ml-4' : 'bg-gray-800/60 border border-gray-700/50 mr-4'} `}>
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
                                        {aiError && (
                                            <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 mt-4">
                                                <p className="text-red-400 text-sm">{aiError}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {aiStep === 'edit' && (
                                    <div className="space-y-4">
                                        <p className="text-gray-400 text-sm mb-4">Review and modify your plan before adding to calendar.</p>
                                        {editablePlan.map((plan, planIndex) => (
                                            <div key={plan.id} className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-xs font-semibold text-purple-400">{formatDate(plan.date)} - {plan.section}</h4>
                                                    <button onClick={() => handleAddTaskToPlan(planIndex)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                        Add
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {plan.tasks.map((task) => (
                                                        <div key={task.id} className="flex gap-2 items-center">
                                                            <input type="text" className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-gray-900 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" value={task.content} onChange={(e) => handleEditTask(planIndex, task.id, e.target.value)} placeholder="Task description..." />
                                                            <button onClick={() => handleRemoveTask(planIndex, task.id)} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex gap-2 pt-4">
                                            <button onClick={() => setAiStep('chat')} className="flex-1 px-4 py-2 text-sm rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">Back to Chat</button>
                                            <button onClick={handleConfirmPlan} className="flex-1 px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all">Add to Calendar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Planning;
