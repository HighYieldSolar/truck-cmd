// src/hooks/useFuel.js - Enhanced with expense integration
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
  // Track entries that are already synced to expenses
  const [syncedEntries, setSyncedEntries] = useState({});

  // Fetch all fuel entries
  const loadFuelEntries = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await fetchFuelEntries(userId, filters);
      
      // Create a lookup table for synced entries
      const synced = {};
      data.forEach(entry => {
        if (entry.expense_id) {
          synced[entry.id] = entry.expense_id;
        }
      });
      setSyncedEntries(synced);
      
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
        try {
          receiptUrl = await uploadReceiptImage(userId, entryData.receipt_file);
          console.log("Receipt uploaded successfully:", receiptUrl);
        } catch (uploadError) {
          console.error('Error uploading receipt:', uploadError);
          // Continue with null receipt URL instead of failing the whole operation
        }
      }
      
      // Remove receipt_file from data before saving to database
      const { receipt_file, receipt_preview, ...dataToSave } = entryData;
      
      // Add receipt URL and user ID
      const entry = await createFuelEntry({
        ...dataToSave,
        receipt_image: receiptUrl || entryData.receipt_image,
        user_id: userId,
        expense_id: null // Initialize with no expense link
      });
      
      // Update local state
      setFuelEntries(prev => [entry, ...prev]);
      await loadStats();
      await loadVehicles();
      
      return entry;
    } catch (err) {
      console.error('Error creating fuel entry:', err);
      setError('Failed to create fuel entry: ' + err.message);
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
      const { receipt_file, receipt_preview, ...dataToSave } = entryData;
      
      // Add receipt URL only if a new one was uploaded
      const updatedEntry = await updateFuelEntry(id, {
        ...dataToSave,
        ...(receiptUrl ? { receipt_image: receiptUrl } : {})
      });
      
      // Update local state
      setFuelEntries(prev => 
        prev.map(entry => entry.id === id ? updatedEntry : entry)
      );
      
      // Check if this entry is already synced to an expense
      if (syncedEntries[id]) {
        // Update the linked expense as well
        await updateLinkedExpense(syncedEntries[id], updatedEntry);
      }
      
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
  }, [userId, loadStats, loadVehicles, syncedEntries]);

  // Update a linked expense when fuel entry is updated
  const updateLinkedExpense = async (expenseId, fuelEntry) => {
    try {
      // Update the expense with new fuel data
      const { error } = await supabase
        .from('expenses')
        .update({
          description: `Fuel - ${fuelEntry.location}`,
          amount: fuelEntry.total_amount,
          date: fuelEntry.date,
          notes: `Vehicle: ${fuelEntry.vehicle_id}, ${fuelEntry.gallons} gallons at ${fuelEntry.state}`,
          receipt_image: fuelEntry.receipt_image,
          vehicle_id: fuelEntry.vehicle_id
        })
        .eq('id', expenseId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating linked expense:', error);
      return false;
    }
  };

  // Delete a fuel entry
  const removeFuelEntry = useCallback(async (id) => {
    try {
      setLoading(true);
      
      // Check if this entry is linked to an expense
      if (syncedEntries[id]) {
        // Delete the linked expense first
        const { error: expenseError } = await supabase
          .from('expenses')
          .delete()
          .eq('id', syncedEntries[id]);
          
        if (expenseError) {
          console.error('Error deleting linked expense:', expenseError);
          // Continue with fuel entry deletion even if expense deletion fails
        }
      }
      
      // Delete the fuel entry
      await deleteFuelEntry(id);
      
      // Update local state
      setFuelEntries(prev => prev.filter(entry => entry.id !== id));
      
      // Remove from synced entries
      const updatedSyncedEntries = {...syncedEntries};
      delete updatedSyncedEntries[id];
      setSyncedEntries(updatedSyncedEntries);
      
      await loadStats();
      
      return true;
    } catch (err) {
      console.error('Error deleting fuel entry:', err);
      setError('Failed to delete fuel entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStats, syncedEntries]);

  // Sync a fuel entry to expenses
  const syncToExpense = useCallback(async (entryId) => {
    try {
      if (!userId || !entryId) return null;
      
      // Get the fuel entry
      const { data: entry, error: entryError } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('id', entryId)
        .single();
        
      if (entryError) throw entryError;
      
      // Create expense data
      const expenseData = {
        user_id: userId,
        description: `Fuel - ${entry.location}`,
        amount: entry.total_amount,
        date: entry.date,
        category: 'Fuel',
        payment_method: entry.payment_method || 'Credit Card',
        notes: `Vehicle: ${entry.vehicle_id}, ${entry.gallons} gallons at ${entry.state}`,
        receipt_image: entry.receipt_image,
        vehicle_id: entry.vehicle_id,
        deductible: true
      };
      
      // Insert the expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select();
        
      if (expenseError) throw expenseError;
      
      // Update the fuel entry with the expense ID
      const { error: updateError } = await supabase
        .from('fuel_entries')
        .update({ expense_id: expense[0].id })
        .eq('id', entryId);
        
      if (updateError) throw updateError;
      
      // Update local state
      setFuelEntries(prev => 
        prev.map(item => 
          item.id === entryId 
            ? { ...item, expense_id: expense[0].id }
            : item
        )
      );
      
      // Update synced entries
      setSyncedEntries(prev => ({
        ...prev,
        [entryId]: expense[0].id
      }));
      
      return expense[0];
    } catch (err) {
      console.error('Error syncing fuel entry to expense:', err);
      throw err;
    }
  }, [userId]);

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
    syncToExpense,
    syncedEntries,
    setError
  };
}