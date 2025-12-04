// src/hooks/useFuel.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  fetchFuelEntries, 
  getFuelEntryById, 
  createFuelEntry, 
  updateFuelEntry, 
  deleteFuelEntry as deleteFuelEntryService,
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

  // Fetch all fuel entries with enhanced vehicle info
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
      
      // Attempt to enhance data with vehicle info
      if (data && data.length > 0) {
        const vehicleIds = data.map(entry => entry.vehicle_id).filter(Boolean);

        if (vehicleIds.length > 0) {
          const { data: vehicles } = await supabase
            .from('vehicles')
            .select('id, name, license_plate')
            .in('id', vehicleIds);

          // Create vehicle lookup map
          const vehicleMap = {};

          if (vehicles && vehicles.length > 0) {
            vehicles.forEach(vehicle => {
              vehicleMap[vehicle.id] = vehicle;
            });
          }

          // Attach vehicle info to entries
          data.forEach(entry => {
            if (entry.vehicle_id && vehicleMap[entry.vehicle_id]) {
              entry.vehicle_name = vehicleMap[entry.vehicle_id].name;
              entry.vehicle_license_plate = vehicleMap[entry.vehicle_id].license_plate;
            }
          });
        }
      }
      
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
        } catch (uploadError) {
          // Continue with null receipt URL instead of failing the whole operation
        }
      }
      
      // Remove receipt_file from data before saving to database
      const { receipt_file, receipt_preview, ...dataToSave } = entryData;
      
      // Create the fuel entry
      const fuelEntryData = {
        ...dataToSave,
        receipt_image: receiptUrl || entryData.receipt_image,
        user_id: userId,
      };

      // Insert directly with supabase client
      const { data: fuelEntryResult, error: fuelError } = await supabase
        .from('fuel_entries')
        .insert([fuelEntryData])
        .select();
      
      if (fuelError) {
        throw fuelError;
      }
      
      if (!fuelEntryResult || fuelEntryResult.length === 0) {
        throw new Error("No data returned after creating fuel entry");
      }
      
      const newFuelEntry = fuelEntryResult[0];

      // Important: Wait a short time and check if an expense was already created
      // This handles the case where a database trigger might also be creating an expense
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the fuel entry again to see if it has an expense_id
      const { data: refreshedEntry, error: refreshError } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('id', newFuelEntry.id)
        .single();
        
      if (!refreshError && refreshedEntry && refreshedEntry.expense_id) {
        // Use the refreshed entry (which includes expense_id)
        const updatedEntry = refreshedEntry;
        
        // Update local state
        setFuelEntries(prev => [updatedEntry, ...prev.filter(e => e.id !== updatedEntry.id)]);
        await loadStats();
        await loadVehicles();
        
        return updatedEntry;
      }
      
      // If no expense was automatically created, create one manually
      // Create a corresponding expense record
      const expenseData = {
        user_id: userId,
        description: `Fuel - ${newFuelEntry.location || 'Unknown Location'}`,
        amount: newFuelEntry.total_amount || 0,
        date: newFuelEntry.date || new Date().toISOString().split('T')[0],
        category: 'Fuel',
        payment_method: 'Credit Card',
        notes: `Vehicle: ${newFuelEntry.vehicle_id || ''}, ${newFuelEntry.gallons || 0} gallons at ${newFuelEntry.state || ''}`,
        receipt_image: newFuelEntry.receipt_image,
        ...(newFuelEntry.vehicle_id ? { vehicle_id: newFuelEntry.vehicle_id } : {})
      };

      // Insert the expense
      const { data: expenseResult, error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select();
      
      if (!expenseError && expenseResult && expenseResult.length > 0) {
        // Update the fuel entry with the expense_id
        const { error: updateError } = await supabase
          .from('fuel_entries')
          .update({ expense_id: expenseResult[0].id })
          .eq('id', newFuelEntry.id);
        
        if (!updateError) {
          // Update our local copy with the expense_id
          newFuelEntry.expense_id = expenseResult[0].id;
        }
      }
      
      // Update local state
      setFuelEntries(prev => [newFuelEntry, ...prev]);
      await loadStats();
      await loadVehicles();
      
      return newFuelEntry;
    } catch (err) {
      console.error('Error creating fuel entry:', err);
      const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError('Failed to create fuel entry: ' + errorMessage);
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

  // Delete a fuel entry (with optional linked expense deletion)
  const removeFuelEntry = useCallback(async (id, deleteLinkedExpense = false) => {
    try {
      setLoading(true);
      
      // First get the fuel entry to check for expense_id
      const { data: fuelEntry, error: fetchError } = await supabase
        .from('fuel_entries')
        .select('expense_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching fuel entry for deletion:', fetchError);
        // Continue anyway to attempt deleting the fuel entry
      }
      
      // If we have a linked expense
      let expenseId = null;
      if (fuelEntry && fuelEntry.expense_id) {
        expenseId = fuelEntry.expense_id;

        // Important: First clear the expense_id reference to handle any foreign key constraints
        const { error: updateError } = await supabase
          .from('fuel_entries')
          .update({ expense_id: null })
          .eq('id', id);
        
        // Continue with deletion regardless of update error

        // If we should delete the linked expense
        if (deleteLinkedExpense && expenseId) {
          
          const { error: expenseError } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId);
          
          // Continue with fuel entry deletion regardless
        }
      }

      // Now delete the fuel entry
      const { error: deleteError } = await supabase
        .from('fuel_entries')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      setFuelEntries(prev => prev.filter(entry => entry.id !== id));
      
      // Remove from synced entries
      if (syncedEntries[id]) {
        const updatedSyncedEntries = {...syncedEntries};
        delete updatedSyncedEntries[id];
        setSyncedEntries(updatedSyncedEntries);
      }
      
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

  // Sync a fuel entry to expenses with duplicate prevention
  const syncToExpense = useCallback(async (entryId) => {
    try {
      if (!userId || !entryId) return null;
      
      // Check if entry already has an expense_id first
      const existingExpenseId = syncedEntries[entryId];
      if (existingExpenseId) {
        // Get the existing expense to return it
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', existingExpenseId)
          .single();
          
        if (expenseError) {
          // Existing expense not found, clear the invalid expense_id
          await supabase
            .from('fuel_entries')
            .update({ expense_id: null })
            .eq('id', entryId);
            
          // Remove from synced entries
          const updatedSyncedEntries = {...syncedEntries};
          delete updatedSyncedEntries[entryId];
          setSyncedEntries(updatedSyncedEntries);
          
          // Now we could allow re-syncing, but for now we'll just return null
          return null;
        }
        
        return expense; // Return the existing expense
      }
      
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
      
      if (!expense || expense.length === 0) {
        throw new Error("Failed to create expense record");
      }
      
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
  }, [userId, syncedEntries]);

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