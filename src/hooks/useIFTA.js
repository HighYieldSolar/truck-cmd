// src/hooks/useIFTA.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, formatError } from "@/lib/supabaseClient";

export default function useIFTA(userId, activeQuarter) {
  const [trips, setTrips] = useState([]);
  const [rates, setRates] = useState([]);
  const [stats, setStats] = useState({
    totalMiles: 0,
    totalGallons: 0,
    avgMpg: 0,
    fuelCostPerMile: 0,
    estimatedTaxLiability: 0,
    uniqueJurisdictions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate summary data from trips and rates
  const calculateSummary = useCallback((tripsData = [], ratesData = []) => {
    if (!tripsData || tripsData.length === 0) {
      setStats({
        totalMiles: 0,
        totalGallons: 0,
        avgMpg: 0,
        fuelCostPerMile: 0,
        estimatedTaxLiability: 0,
        uniqueJurisdictions: 0
      });
      return;
    }
    
    try {
      // Calculate base statistics
      const totalMiles = tripsData.reduce((sum, trip) => sum + parseFloat(trip.miles || 0), 0);
      const totalGallons = tripsData.reduce((sum, trip) => sum + Math.round(parseFloat(trip.gallons || 0)), 0);
      const totalFuelCost = tripsData.reduce((sum, trip) => sum + parseFloat(trip.fuelCost || 0), 0);
      
      // Calculate average MPG and cost per mile
      const avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
      const fuelCostPerMile = totalMiles > 0 ? totalFuelCost / totalMiles : 0;
      
      // Count unique jurisdictions
      const allJurisdictions = [
        ...tripsData.map(trip => trip.startJurisdiction),
        ...tripsData.map(trip => trip.endJurisdiction)
      ].filter(Boolean);
      const uniqueJurisdictions = new Set(allJurisdictions).size;
      
      // Calculate estimated tax liability (only if user-provided rates exist)
      let estimatedTaxLiability = 0;
      
      if (ratesData && ratesData.length > 0) {
        // Group miles by jurisdiction
        const milesByJurisdiction = {};
        
        tripsData.forEach(trip => {
          if (trip.startJurisdiction === trip.endJurisdiction && trip.startJurisdiction) {
            // All miles belong to one jurisdiction
            milesByJurisdiction[trip.startJurisdiction] = (milesByJurisdiction[trip.startJurisdiction] || 0) + parseFloat(trip.miles || 0);
          } else if (trip.startJurisdiction && trip.endJurisdiction) {
            // Split miles evenly (simplified)
            const milesPerJurisdiction = parseFloat(trip.miles || 0) / 2;
            milesByJurisdiction[trip.startJurisdiction] = (milesByJurisdiction[trip.startJurisdiction] || 0) + milesPerJurisdiction;
            milesByJurisdiction[trip.endJurisdiction] = (milesByJurisdiction[trip.endJurisdiction] || 0) + milesPerJurisdiction;
          }
        });
        
        // Calculate gallons used in each jurisdiction based on miles and average MPG
        Object.entries(milesByJurisdiction).forEach(([jurisdiction, miles]) => {
          const gallonsUsed = avgMpg > 0 ? miles / avgMpg : 0;
          
          // Find tax rate for this jurisdiction
          const jurisdictionRate = ratesData.find(r => {
            // Check both full name with code and just the code
            return (
              r.jurisdiction.includes(jurisdiction) || 
              r.jurisdiction.includes(`(${jurisdiction})`)
            );
          });
          
          if (jurisdictionRate) {
            // Calculate tax for this jurisdiction
            const jurisdictionTax = gallonsUsed * jurisdictionRate.totalRate;
            estimatedTaxLiability += jurisdictionTax;
          }
        });
      }
      
      setStats({
        totalMiles,
        totalGallons,
        avgMpg,
        fuelCostPerMile,
        estimatedTaxLiability,
        uniqueJurisdictions
      });
    } catch (err) {
      // Don't update stats if calculation fails
    }
  }, []);

  // Load trips for the active quarter
  const loadTrips = useCallback(async (quarter) => {
    if (!userId || !quarter) {
      setTrips([]);
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Query trips for this user and quarter
      const { data, error: tripsError } = await supabase
        .from('ifta_trips')
        .select('*')
        .eq('user_id', userId)
        .eq('quarter', quarter)
        .order('date', { ascending: false });
        
      if (tripsError) {
        throw tripsError;
      }
      
      setTrips(data || []);
      calculateSummary(data, rates);
      
      return data;
    } catch (err) {
      setError(formatError(err, 'Failed to load trips. Please try again.'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, rates, calculateSummary]);

  // Load IFTA tax rates - Now only loads user-added rates without fallbacks
  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current date for filtering
      const now = new Date().toISOString().split('T')[0];
      
      // Get rates from DB with effective date filtering
      const { data, error: ratesError } = await supabase
        .from('ifta_tax_rates')
        .select('*')
        .lte('effective_date', now)
        .or(`expiration_date.gt.${now},expiration_date.is.null`)
        .order('jurisdiction', { ascending: true });
        
      if (ratesError) {
        throw ratesError;
      }
      
      // Set rates only if data exists, otherwise use empty array
      setRates(data || []);
      calculateSummary(trips, data || []);
      
      return data || [];
    } catch (err) {
      setError(formatError(err, 'Failed to load tax rates. Please add your own rates for accurate calculations.'));
      
      // Don't provide any fallback rates - return empty array
      setRates([]);
      calculateSummary(trips, []);
      return [];
    } finally {
      setLoading(false);
    }
  }, [trips, calculateSummary]);

  // Add a new trip
  const addTrip = useCallback(async (tripData) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Add user_id to the trip data
      const newTrip = {
        ...tripData,
        user_id: userId,
      };
      
      // Save to database
      const { data, error: insertError } = await supabase
        .from('ifta_trips')
        .insert([newTrip])
        .select();
        
      if (insertError) {
        throw insertError;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Failed to add trip: No data returned');
      }
      
      // Update local state
      const newTripData = data[0];
      setTrips(prev => [newTripData, ...prev]);
      
      // Recalculate summary with the new trip
      calculateSummary([...trips, newTripData], rates);
      
      return newTripData;
    } catch (err) {
      setError(formatError(err, 'Failed to add trip. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, trips, rates, calculateSummary]);

  // Update an existing trip
  const updateTrip = useCallback(async (id, tripData) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Update in database
      const { data, error: updateError } = await supabase
        .from('ifta_trips')
        .update(tripData)
        .eq('id', id)
        .eq('user_id', userId) // Ensure user owns this record
        .select();
        
      if (updateError) {
        throw updateError;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Trip not found or you do not have permission to update it');
      }
      
      // Update local state
      const updatedTrip = data[0];
      setTrips(prev => prev.map(trip => trip.id === id ? updatedTrip : trip));
      
      // Recalculate summary with the updated trip
      calculateSummary(trips.map(trip => trip.id === id ? updatedTrip : trip), rates);
      
      return updatedTrip;
    } catch (err) {
      setError(formatError(err, 'Failed to update trip. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, trips, rates, calculateSummary]);

  // Delete a trip
  const deleteTrip = useCallback(async (id) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('ifta_trips')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure user owns this record
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      const updatedTrips = trips.filter(trip => trip.id !== id);
      setTrips(updatedTrips);
      
      // Recalculate summary without the deleted trip
      calculateSummary(updatedTrips, rates);
      
      return true;
    } catch (err) {
      setError(formatError(err, 'Failed to delete trip. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, trips, rates, calculateSummary]);

  // Add a tax rate
  const addRate = useCallback(async (rateData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Save to database
      const { data, error: insertError } = await supabase
        .from('ifta_tax_rates')
        .insert([{
          ...rateData,
          effective_date: rateData.effective_date || new Date().toISOString().split('T')[0]
        }])
        .select();
        
      if (insertError) {
        throw insertError;
      }
      
      // Update local state and recalculate
      setRates(prev => [...prev, data[0]]);
      calculateSummary(trips, [...rates, data[0]]);
      
      return data[0];
    } catch (err) {
      setError(formatError(err, 'Failed to add tax rate. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trips, rates, calculateSummary]);

  // Initial data loading
  useEffect(() => {
    if (userId && activeQuarter) {
      loadTrips(activeQuarter);
      loadRates();
    }
  }, [userId, activeQuarter, loadTrips, loadRates]);

  return {
    trips,
    rates,
    stats,
    loading,
    error,
    loadTrips,
    loadRates,
    addTrip,
    updateTrip,
    deleteTrip,
    addRate,
    calculateSummary
  };
}