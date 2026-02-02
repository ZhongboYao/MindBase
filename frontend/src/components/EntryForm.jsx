import React, { useState } from 'react';

const EntryForm = ({ isOpen, onClose, onSave, selectedDate }) => {
    const [content, setContent] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ date: selectedDate, content });
        setContent('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-white bg-gradient-to-r from-north-blue to-white bg-clip-text text-transparent">
                    Add Learning
                </h2>
                <p className="text-gray-400 mb-4 text-sm">
                    What did you learn on {selectedDate}?
                </p>
                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-north-blue focus:border-transparent transition-all duration-200 mb-4"
                        rows="4"
                        placeholder="I learned about..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-north-blue to-cyan-600 text-white font-semibold hover:from-cyan-500 hover:to-north-blue transform hover:scale-105 transition-all duration-200 shadow-lg shadow-north-blue/20"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EntryForm;
