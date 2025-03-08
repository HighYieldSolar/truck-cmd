// src/hooks/useFuel.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  fetchFuelEntries, 
  getFuelEntryById, 
  createFuelEntry, 
  updateFuelEntry, 
  deleteFuelEntry,
  getFuelStats,
  uploadReceiptImage,
  getVehiclesWithFuelRecords
} from '@/lib/services/fuelService';

export default function useFuel(userId) {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalGallons: 0,
    totalAmount: 0,
    avgPricePerGallon: 0,
    uniqueStates: 0,
    entryCount: 0,
    byState: {}
  });
  const [vehicles, setVehicles] = useState([]);

  // Fetch all fuel entries
  const loadFuelEntries = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await fetchFuelEntries(userId, filters);
      setFuelEntries(data);
      return data;
    } catch (err) {
      console.error('Error loading fuel entries:', err);
      setError('Failed to load fuel entries');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch fuel stats
  const loadStats = useCallback(async (period = 'quarter') => {
    try {
      const stats = await getFuelStats(userId, period);
      setStats(stats);
      return stats;
    } catch (err) {
      console.error('Error loading fuel stats:', err);
      return {
        totalGallons: 0,
        totalAmount: 0,
        avgPricePerGallon: 0,
        uniqueStates: 0,
        entryCount: 0,
        byState: {}
      };
    }
  }, [userId]);

  // Load vehicles with fuel records
  const loadVehicles = useCallback(async () => {
    try {
      const vehicles = await getVehiclesWithFuelRecords(userId);
      setVehicles(vehicles);
      return vehicles;
    } catch (err) {
      console.error('Error loading vehicles:', err);
      return [];
    }
  }, [userId]);

  // Get a single fuel entry
  const getFuelEntry = useCallback(async (id) => {
    try {
      setLoading(true);
      const entry = await getFuelEntryById(id);
      return entry;
    } catch (err) {
      console.error('Error getting fuel entry:', err);
      setError('Failed to load fuel entry');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new fuel entry
  const addFuelEntry = useCallback(async (entryData) => {
    try {
      setLoading(true);
      
      // Handle receipt upload if there's a file
      let receiptUrl = null;
      if (entryData.receipt_file) {
        receiptUrl = await uploadReceiptImage(userId, entryData.receipt_file);
      }
      
      // Remove receipt_file from data before saving to database
      const { receipt_file, ...dataToSave } = entryData;
      
      // Add receipt URL and user ID
      const entry = await createFuelEntry({
        ...dataToSave,
        receipt_image: receiptUrl || entryData.receipt_image,
        user_id: userId
      });
      
      // Update local state
      setFuelEntries(prev => [entry, ...prev]);
      await loadStats();
      await loadVehicles();
      
      return entry;
    } catch (err) {
      console.error('Error creating fuel entry:', err);
      setError('Failed to create fuel entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStats, loadVehicles]);

  // Update an existing fuel entry
  const updateFuelEntryData = useCallback(async (id, entryData) => {
    try {
      setLoading(true);
      
      // Handle receipt upload if there's a file
      let receiptUrl = null;
      if (entryData.receipt_file) {
        receiptUrl = await uploadReceiptImage(userId, entryData.receipt_file);
      }
      
      // Remove receipt_file from data before saving to database
      const { receipt_file, ...dataToSave } = entryData;
      
      // Add receipt URL only if a new one was uploaded
      const updatedEntry = await updateFuelEntry(id, {
        ...dataToSave,
        ...(receiptUrl ? { receipt_image: receiptUrl } : {})
      });
      
      // Update local state
      setFuelEntries(prev => 
        prev.map(entry => entry.id === id ? updatedEntry : entry)
      );
      
      await loadStats();
      await loadVehicles();
      
      return updatedEntry;
    } catch (err) {
      console.error('Error updating fuel entry:', err);
      setError('Failed to update fuel entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStats, loadVehicles]);

  // Delete a fuel entry
  const removeFuelEntry = useCallback(async (id) => {
    try {
      setLoading(true);
      await deleteFuelEntry(id);
      
      // Update local state
      setFuelEntries(prev => prev.filter(entry => entry.id !== id));
      await loadStats();
      
      return true;
    } catch (err) {
      console.error('Error deleting fuel entry:', err);
      setError('Failed to delete fuel entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Initial data loading
  useEffect(() => {
    if (userId) {
      (async () => {
        await loadFuelEntries();
        await loadStats();
        await loadVehicles();
      })();
    }
  }, [userId, loadFuelEntries, loadStats, loadVehicles]);

  return {
    fuelEntries,
    stats,
    vehicles,
    loading,
    error,
    loadFuelEntries,
    loadStats,
    loadVehicles,
    getFuelEntry,
    addFuelEntry,
    updateFuelEntry: updateFuelEntryData,
    deleteFuelEntry: removeFuelEntry,
    setError
  };
}