import React, { useState } from 'react';

const AIAssistant = ({ date, onAddPlans }) => {
    // AI Planning Workflow State
    const [aiStep, setAiStep] = useState('chat'); // 'chat', 'edit'
    const [taskDescription, setTaskDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [extractedPlan, setExtractedPlan] = useState(null);
    const [editablePlan, setEditablePlan] = useState([]);
    const [aiError, setAiError] = useState('');

    const availableModels = [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)', description: 'Best for quick planning' },
        { id: 'gpt-4o', name: 'GPT-4o (Balanced)', description: 'Good balance of speed and quality' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Powerful)', description: 'Most capable for complex tasks' }
    ];

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Select a date';
        const d = new Date(dateStr);
        return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const handleReset = () => {
        setAiStep('chat');
        setChatMessages([]);
        setTaskDescription('');
        setDeadline('');
        setUserInput('');
        setExtractedPlan(null);
        setEditablePlan([]);
        setAiError('');
    };

    // Send initial message to start conversation
    const handleSendInitialMessage = async () => {
        if (!taskDescription.trim() || !deadline) {
            setAiError('Please provide both task description and deadline');
            return;
        }

        const initialMessage = `I need help planning: ${taskDescription}. My deadline is ${deadline}.`;
        await handleSendMessage(initialMessage);
    };

    // Send message in chat
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
                body: JSON.stringify({
                    messages: updatedMessages,
                    model: selectedModel
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to chat with AI');
            }

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.message };
            setChatMessages([...updatedMessages, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setAiError(error.message || 'Failed to communicate with AI');
        } finally {
            setIsLoading(false);
        }
    };

    // Extract plan from conversation
    const handleUsePlan = async () => {
        setIsLoading(true);
        setAiError('');

        try {
            const response = await fetch('/api/extract-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation: chatMessages,
                    start_date: date,
                    deadline: deadline,
                    model: selectedModel
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to extract plan');
            }

            const data = await response.json();
            setExtractedPlan(data);

            // Convert to editable format
            const editable = data.plans.map((plan, index) => ({
                id: index,
                date: plan.date,
                section: plan.section,
                tasks: plan.tasks.map((task, taskIndex) => ({
                    id: `${index}-${taskIndex}`,
                    content: task,
                    editing: false
                }))
            }));
            setEditablePlan(editable);
            setAiStep('edit');
        } catch (error) {
            console.error('Extract plan error:', error);
            setAiError(error.message || 'Failed to extract plan');
        } finally {
            setIsLoading(false);
        }
    };

    // Modify task in editable plan
    const handleEditTask = (planIndex, taskId, newContent) => {
        const updated = [...editablePlan];
        const taskIndex = updated[planIndex].tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            updated[planIndex].tasks[taskIndex].content = newContent;
            setEditablePlan(updated);
        }
    };

    // Remove task from editable plan
    const handleRemoveTask = (planIndex, taskId) => {
        const updated = [...editablePlan];
        updated[planIndex].tasks = updated[planIndex].tasks.filter(t => t.id !== taskId);
        setEditablePlan(updated);
    };

    // Add task to editable plan
    const handleAddTaskToPlan = (planIndex) => {
        const updated = [...editablePlan];
        const newTask = {
            id: `${planIndex}-${Date.now()}`,
            content: '',
            editing: true
        };
        updated[planIndex].tasks.push(newTask);
        setEditablePlan(updated);
    };

    // Confirm and add to calendar
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

        // Call the parent's onAddPlans with the task group
        onAddPlans(plansToAdd, taskDescription);

        // Reset to initial state
        handleReset();
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 shadow-xl h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <span className="w-2 h-8 rounded-full bg-gradient-to-b from-purple-400 to-pink-500 block"></span>
                    AI Assistant
                </h2>
                {chatMessages.length > 0 && (
                    <button
                        onClick={handleReset}
                        className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        New Task
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {aiStep === 'chat' && (
                    <div className="space-y-4">
                        {chatMessages.length === 0 ? (
                            <>
                                <p className="text-gray-400 text-sm mb-4">
                                    Describe what you want to accomplish and your deadline. I'll help you create a detailed plan!
                                </p>

                                {/* Model Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        AI Model
                                    </label>
                                    <select
                                        className="w-full p-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                    >
                                        {availableModels.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {availableModels.find(m => m.id === selectedModel)?.description}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        What do you want to accomplish?
                                    </label>
                                    <textarea
                                        className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                                        rows="3"
                                        placeholder="e.g., Learn to play chess"
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Deadline
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        min={date}
                                    />
                                </div>

                                <button
                                    onClick={handleSendInitialMessage}
                                    disabled={isLoading || !taskDescription || !deadline}
                                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    Start Planning
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {chatMessages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg text-sm ${msg.role === 'user'
                                                ? 'bg-purple-600/20 border border-purple-500/30 ml-4'
                                                : 'bg-gray-800/60 border border-gray-700/50 mr-4'
                                                }`}
                                        >
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
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Ask questions or provide more details..."
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                                            disabled={isLoading}
                                        />
                                        <button
                                            onClick={() => handleSendMessage()}
                                            disabled={isLoading || !userInput.trim()}
                                            className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Send
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleUsePlan}
                                        disabled={isLoading}
                                        className="w-full px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        Use This Plan
                                    </button>
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
                        <p className="text-gray-400 text-sm mb-4">
                            Review and modify your plan. Edit tasks, add new ones, or remove items before adding to your calendar.
                        </p>
                        {editablePlan.map((plan, planIndex) => (
                            <div key={plan.id} className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-xs font-semibold text-purple-400">
                                        {formatDate(plan.date)} - {plan.section}
                                    </h4>
                                    <button
                                        onClick={() => handleAddTaskToPlan(planIndex)}
                                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {plan.tasks.map((task) => (
                                        <div key={task.id} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-gray-900 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                value={task.content}
                                                onChange={(e) => handleEditTask(planIndex, task.id, e.target.value)}
                                                placeholder="Task description..."
                                            />
                                            <button
                                                onClick={() => handleRemoveTask(planIndex, task.id)}
                                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                                title="Remove task"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => setAiStep('chat')}
                                className="flex-1 px-4 py-2 text-sm rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                Back to Chat
                            </button>
                            <button
                                onClick={handleConfirmPlan}
                                className="flex-1 px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-200"
                            >
                                Add to Calendar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAssistant;
