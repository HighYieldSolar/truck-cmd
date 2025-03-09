// src/hooks/useIFTA.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

  // Load trips for the active quarter
  const loadTrips = useCallback(async (quarter) => {
    try {
      setLoading(true);
      
      if (!userId || !quarter) {
        setTrips([]);
        return;
      }
      
      // Query trips for this user and quarter
      const { data, error } = await supabase
        .from('ifta_trips')
        .select('*')
        .eq('user_id', userId)
        .eq('quarter', quarter);
        
      if (error) throw error;
      
      setTrips(data || []);
      calculateSummary(data, rates);
      
      return data;
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load trips. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, rates]);

  // Load IFTA tax rates
  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get rates from DB or fallback to sample rates if not available
      const { data, error } = await supabase
        .from('ifta_tax_rates')
        .select('*')
        .order('jurisdiction', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setRates(data);
        calculateSummary(trips, data);
      } else {
        // Fallback to sample rates
        const sampleRates = [
          { jurisdiction: "Alabama (AL)", rate: 0.290, surcharge: 0.000, totalRate: 0.290 },
          { jurisdiction: "Arizona (AZ)", rate: 0.260, surcharge: 0.010, totalRate: 0.270 },
          { jurisdiction: "Arkansas (AR)", rate: 0.285, surcharge: 0.005, totalRate: 0.290 },
          { jurisdiction: "California (CA)", rate: 0.668, surcharge: 0.000, totalRate: 0.668 },
          { jurisdiction: "Colorado (CO)", rate: 0.220, surcharge: 0.000, totalRate: 0.220 },
          { jurisdiction: "Connecticut (CT)", rate: 0.400, surcharge: 0.000, totalRate: 0.400 },
          { jurisdiction: "Delaware (DE)", rate: 0.230, surcharge: 0.000, totalRate: 0.230 },
          { jurisdiction: "Florida (FL)", rate: 0.350, surcharge: 0.000, totalRate: 0.350 },
          { jurisdiction: "Georgia (GA)", rate: 0.321, surcharge: 0.007, totalRate: 0.328 },
          { jurisdiction: "Idaho (ID)", rate: 0.330, surcharge: 0.010, totalRate: 0.340 },
          { jurisdiction: "Illinois (IL)", rate: 0.467, surcharge: 0.000, totalRate: 0.467 },
          { jurisdiction: "Indiana (IN)", rate: 0.320, surcharge: 0.110, totalRate: 0.430 },
          { jurisdiction: "Iowa (IA)", rate: 0.325, surcharge: 0.000, totalRate: 0.325 },
          { jurisdiction: "Kansas (KS)", rate: 0.260, surcharge: 0.000, totalRate: 0.260 },
          { jurisdiction: "Kentucky (KY)", rate: 0.225, surcharge: 0.019, totalRate: 0.244 },
          { jurisdiction: "Louisiana (LA)", rate: 0.200, surcharge: 0.000, totalRate: 0.200 },
          { jurisdiction: "Maine (ME)", rate: 0.312, surcharge: 0.000, totalRate: 0.312 },
          { jurisdiction: "Maryland (MD)", rate: 0.362, surcharge: 0.000, totalRate: 0.362 },
          { jurisdiction: "Massachusetts (MA)", rate: 0.240, surcharge: 0.000, totalRate: 0.240 },
          { jurisdiction: "Michigan (MI)", rate: 0.263, surcharge: 0.000, totalRate: 0.263 },
          { jurisdiction: "Minnesota (MN)", rate: 0.285, surcharge: 0.000, totalRate: 0.285 },
          { jurisdiction: "Mississippi (MS)", rate: 0.180, surcharge: 0.000, totalRate: 0.180 },
          { jurisdiction: "Missouri (MO)", rate: 0.170, surcharge: 0.000, totalRate: 0.170 },
          { jurisdiction: "Montana (MT)", rate: 0.295, surcharge: 0.000, totalRate: 0.295 },
          { jurisdiction: "Nebraska (NE)", rate: 0.284, surcharge: 0.000, totalRate: 0.284 },
          { jurisdiction: "Nevada (NV)", rate: 0.230, surcharge: 0.000, totalRate: 0.230 },
          { jurisdiction: "New Hampshire (NH)", rate: 0.222, surcharge: 0.000, totalRate: 0.222 },
          { jurisdiction: "New Jersey (NJ)", rate: 0.175, surcharge: 0.000, totalRate: 0.175 },
          { jurisdiction: "New Mexico (NM)", rate: 0.170, surcharge: 0.010, totalRate: 0.180 },
          { jurisdiction: "New York (NY)", rate: 0.246, surcharge: 0.000, totalRate: 0.246 },
          { jurisdiction: "North Carolina (NC)", rate: 0.362, surcharge: 0.000, totalRate: 0.362 },
          { jurisdiction: "North Dakota (ND)", rate: 0.230, surcharge: 0.000, totalRate: 0.230 },
          { jurisdiction: "Ohio (OH)", rate: 0.380, surcharge: 0.000, totalRate: 0.380 },
          { jurisdiction: "Oklahoma (OK)", rate: 0.200, surcharge: 0.000, totalRate: 0.200 },
          { jurisdiction: "Oregon (OR)", rate: 0.000, surcharge: 0.000, totalRate: 0.000 },
          { jurisdiction: "Pennsylvania (PA)", rate: 0.576, surcharge: 0.000, totalRate: 0.576 },
          { jurisdiction: "Rhode Island (RI)", rate: 0.350, surcharge: 0.000, totalRate: 0.350 },
          { jurisdiction: "South Carolina (SC)", rate: 0.260, surcharge: 0.000, totalRate: 0.260 },
          { jurisdiction: "South Dakota (SD)", rate: 0.300, surcharge: 0.020, totalRate: 0.320 },
          { jurisdiction: "Tennessee (TN)", rate: 0.240, surcharge: 0.010, totalRate: 0.250 },
          { jurisdiction: "Texas (TX)", rate: 0.200, surcharge: 0.000, totalRate: 0.200 },
          { jurisdiction: "Utah (UT)", rate: 0.300, surcharge: 0.000, totalRate: 0.300 },
          { jurisdiction: "Vermont (VT)", rate: 0.320, surcharge: 0.000, totalRate: 0.320 },
          { jurisdiction: "Virginia (VA)", rate: 0.262, surcharge: 0.000, totalRate: 0.262 },
          { jurisdiction: "Washington (WA)", rate: 0.494, surcharge: 0.000, totalRate: 0.494 },
          { jurisdiction: "West Virginia (WV)", rate: 0.357, surcharge: 0.000, totalRate: 0.357 },
          { jurisdiction: "Wisconsin (WI)", rate: 0.309, surcharge: 0.000, totalRate: 0.309 },
          { jurisdiction: "Wyoming (WY)", rate: 0.240, surcharge: 0.000, totalRate: 0.240 },
          { jurisdiction: "Alberta (AB)", rate: 0.090, surcharge: 0.000, totalRate: 0.090 },
          { jurisdiction: "British Columbia (BC)", rate: 0.330, surcharge: 0.000, totalRate: 0.330 },
          { jurisdiction: "Manitoba (MB)", rate: 0.140, surcharge: 0.000, totalRate: 0.140 },
          { jurisdiction: "New Brunswick (NB)", rate: 0.275, surcharge: 0.000, totalRate: 0.275 },
          { jurisdiction: "Newfoundland (NL)", rate: 0.165, surcharge: 0.000, totalRate: 0.165 },
          { jurisdiction: "Nova Scotia (NS)", rate: 0.154, surcharge: 0.000, totalRate: 0.154 },
          { jurisdiction: "Ontario (ON)", rate: 0.270, surcharge: 0.000, totalRate: 0.270 },
          { jurisdiction: "Prince Edward Island (PE)", rate: 0.000, surcharge: 0.000, totalRate: 0.000 },
          { jurisdiction: "Quebec (QC)", rate: 0.202, surcharge: 0.000, totalRate: 0.202 },
          { jurisdiction: "Saskatchewan (SK)", rate: 0.150, surcharge: 0.000, totalRate: 0.150 }
        ];
        
        setRates(sampleRates);
        calculateSummary(trips, sampleRates);
      }
      
      return rates;
    } catch (err) {
      console.error('Error loading tax rates:', err);
      setError('Failed to load tax rates. Using default values.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [trips]);

  // Add a new trip
  const addTrip = useCallback(async (tripData) => {
    try {
      setLoading(true);
      
      // Add user_id to the trip data
      const newTrip = {
        ...tripData,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      // Save to database
      const { data, error } = await supabase
        .from('ifta_trips')
        .insert([newTrip])
        .select();
        
      if (error) throw error;
      
      // Update local state
      const newTripData = data[0];
      setTrips(prev => [...prev, newTripData]);
      
      // Recalculate summary with the new trip
      calculateSummary([...trips, newTripData], rates);
      
      return newTripData;
    } catch (err) {
      console.error('Error adding trip:', err);
      setError('Failed to add trip. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, trips, rates]);

  // Update an existing trip
  const updateTrip = useCallback(async (id, tripData) => {
    try {
      setLoading(true);
      
      // Update in database
      const { data, error } = await supabase
        .from('ifta_trips')
        .update(tripData)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Trip not found');
      }
      
      // Update local state
      const updatedTrip = data[0];
      setTrips(prev => prev.map(trip => trip.id === id ? updatedTrip : trip));
      
      // Recalculate summary with the updated trip
      calculateSummary(trips.map(trip => trip.id === id ? updatedTrip : trip), rates);
      
      return updatedTrip;
    } catch (err) {
      console.error('Error updating trip:', err);
      setError('Failed to update trip. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trips, rates]);

  // Delete a trip
  const deleteTrip = useCallback(async (id) => {
    try {
      setLoading(true);
      
      // Delete from database
      const { error } = await supabase
        .from('ifta_trips')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      const updatedTrips = trips.filter(trip => trip.id !== id);
      setTrips(updatedTrips);
      
      // Recalculate summary without the deleted trip
      calculateSummary(updatedTrips, rates);
      
      return true;
    } catch (err) {
      console.error('Error deleting trip:', err);
      setError('Failed to delete trip. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trips, rates]);

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
    
    // Calculate base statistics
    const totalMiles = tripsData.reduce((sum, trip) => sum + parseFloat(trip.miles || 0), 0);
    const totalGallons = tripsData.reduce((sum, trip) => sum + parseFloat(trip.gallons || 0), 0);
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
    
    // Calculate estimated tax liability
    let estimatedTaxLiability = 0;
    
    if (ratesData && ratesData.length > 0) {
      // Group miles by jurisdiction (simplified approach)
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
        const jurisdictionRate = ratesData.find(r => r.jurisdiction.includes(jurisdiction));
        
        if (jurisdictionRate) {
          // Calculate tax for this jurisdiction (simplified)
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
  }, []);

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
    calculateSummary
  };
}