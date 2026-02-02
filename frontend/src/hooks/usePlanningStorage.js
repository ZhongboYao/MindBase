import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage planning data with backend storage
 * Replaces localStorage with API calls to persist data in planning_data.json
 */
const usePlanningStorage = (planType) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data from backend
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/planning/${planType}`);
            if (response.ok) {
                const result = await response.json();
                setData(result[planType] || []);
                setError(null);
            } else {
                throw new Error(`Failed to fetch ${planType}`);
            }
        } catch (err) {
            console.error(`Error fetching ${planType}:`, err);
            setError(err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [planType]);

    // Load data on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update data in backend
    const updateData = useCallback(async (newData) => {
        try {
            const response = await fetch(`/api/planning/${planType}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });

            if (response.ok) {
                setData(newData);
                setError(null);
                return true;
            } else {
                throw new Error(`Failed to update ${planType}`);
            }
        } catch (err) {
            console.error(`Error updating ${planType}:`, err);
            setError(err.message);
            return false;
        }
    }, [planType]);

    // Add a single item
    const addItem = useCallback(async (item) => {
        const newData = [...data, item];
        return await updateData(newData);
    }, [data, updateData]);

    // Update a single item
    const updateItem = useCallback(async (id, updates) => {
        const newData = data.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        return await updateData(newData);
    }, [data, updateData]);

    // Delete a single item
    const deleteItem = useCallback(async (id) => {
        const newData = data.filter(item => item.id !== id);
        return await updateData(newData);
    }, [data, updateData]);

    return {
        data,
        loading,
        error,
        setData: updateData,
        addItem,
        updateItem,
        deleteItem,
        refresh: fetchData
    };
};

export default usePlanningStorage;
