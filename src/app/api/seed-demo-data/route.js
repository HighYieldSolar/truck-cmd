// src/app/api/seed-demo-data/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Seeds demo data for a new user to help them experience the app immediately.
 * Creates sample trucks, customers, loads, invoices, expenses, and fuel entries.
 */
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user already has data (don't overwrite)
    const { data: existingVehicles } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingVehicles?.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'User already has data, skipping seed',
        seeded: false
      });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Create demo trucks (vehicles table)
    const demoTrucks = [
      {
        user_id: userId,
        name: 'Big Blue',
        make: 'Peterbilt',
        model: '579',
        year: 2022,
        vin: 'DEMO1234567890001',
        license_plate: 'DEMO-001',
        status: 'Active',
        type: 'Semi Truck',
        fuel_type: 'Diesel',
        notes: 'Demo truck - Primary long-haul vehicle'
      },
      {
        user_id: userId,
        name: 'Road Runner',
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2021,
        vin: 'DEMO1234567890002',
        license_plate: 'DEMO-002',
        status: 'Active',
        type: 'Semi Truck',
        fuel_type: 'Diesel',
        notes: 'Demo truck - Regional deliveries'
      }
    ];

    const { data: trucks, error: trucksError } = await supabaseAdmin
      .from('vehicles')
      .insert(demoTrucks)
      .select();

    if (trucksError) throw trucksError;

    // 2. Create demo customers
    const demoCustomers = [
      {
        user_id: userId,
        company_name: 'ABC Logistics Inc.',
        contact_name: 'John Smith',
        email: 'dispatch@demo-abc-logistics.com',
        phone: '(555) 123-4567',
        address: '123 Industrial Blvd',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        customer_type: 'Broker',
        status: 'Active',
        payment_terms: 'Net 15',
        notes: 'Demo customer - Regular freight partner'
      },
      {
        user_id: userId,
        company_name: 'XYZ Freight Solutions',
        contact_name: 'Sarah Johnson',
        email: 'loads@demo-xyz-freight.com',
        phone: '(555) 987-6543',
        address: '456 Commerce Way',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        customer_type: 'Shipper',
        status: 'Active',
        payment_terms: 'Net 30',
        notes: 'Demo customer - Weekly lane contracts'
      },
      {
        user_id: userId,
        company_name: 'Quick Ship Express',
        contact_name: 'Mike Davis',
        email: 'booking@demo-quickship.com',
        phone: '(555) 456-7890',
        address: '789 Logistics Park',
        city: 'Atlanta',
        state: 'GA',
        zip: '30301',
        customer_type: 'Broker',
        status: 'Active',
        payment_terms: 'Net 15',
        notes: 'Demo customer - Hot shot loads'
      }
    ];

    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .insert(demoCustomers)
      .select();

    if (customersError) throw customersError;

    // 3. Create demo loads
    const demoLoads = [
      {
        user_id: userId,
        customer_id: customers[0].id,
        customer: customers[0].company_name,
        vehicle_id: trucks[0].id,
        load_number: 'DEMO-1001',
        status: 'Delivered',
        origin: 'Dallas, TX',
        pickup_date: twoWeeksAgo.toISOString().split('T')[0],
        destination: 'Houston, TX',
        delivery_date: twoWeeksAgo.toISOString().split('T')[0],
        rate: 1850.00,
        distance: 240,
        description: 'General Freight - 42,000 lbs',
        notes: 'Demo load - Completed delivery'
      },
      {
        user_id: userId,
        customer_id: customers[1].id,
        customer: customers[1].company_name,
        vehicle_id: trucks[0].id,
        load_number: 'DEMO-1002',
        status: 'Delivered',
        origin: 'Houston, TX',
        pickup_date: oneWeekAgo.toISOString().split('T')[0],
        destination: 'Atlanta, GA',
        delivery_date: oneWeekAgo.toISOString().split('T')[0],
        rate: 3200.00,
        distance: 790,
        description: 'Electronics - 38,000 lbs',
        notes: 'Demo load - Long haul completed'
      },
      {
        user_id: userId,
        customer_id: customers[2].id,
        customer: customers[2].company_name,
        vehicle_id: trucks[1].id,
        load_number: 'DEMO-1003',
        status: 'In Transit',
        origin: 'Atlanta, GA',
        pickup_date: now.toISOString().split('T')[0],
        destination: 'Nashville, TN',
        delivery_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rate: 1450.00,
        distance: 250,
        description: 'Retail Goods - 35,000 lbs',
        notes: 'Demo load - Currently in transit'
      },
      {
        user_id: userId,
        customer_id: customers[0].id,
        customer: customers[0].company_name,
        vehicle_id: trucks[0].id,
        load_number: 'DEMO-1004',
        status: 'Pending',
        origin: 'Nashville, TN',
        pickup_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        destination: 'Memphis, TN',
        delivery_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rate: 950.00,
        distance: 210,
        description: 'Auto Parts - 28,000 lbs',
        notes: 'Demo load - Upcoming pickup'
      }
    ];

    const { data: loads, error: loadsError } = await supabaseAdmin
      .from('loads')
      .insert(demoLoads)
      .select();

    if (loadsError) throw loadsError;

    // 4. Create demo invoices for delivered loads
    const demoInvoices = [
      {
        user_id: userId,
        customer_id: customers[0].id,
        customer: customers[0].company_name,
        load_id: loads[0].id,
        invoice_number: 'INV-DEMO-001',
        invoice_date: twoWeeksAgo.toISOString().split('T')[0],
        due_date: oneWeekAgo.toISOString().split('T')[0],
        status: 'Paid',
        subtotal: 1850.00,
        total: 1850.00,
        amount_paid: 1850.00,
        payment_date: oneWeekAgo.toISOString().split('T')[0],
        terms: 'Net 15',
        notes: 'Demo invoice - Paid on time'
      },
      {
        user_id: userId,
        customer_id: customers[1].id,
        customer: customers[1].company_name,
        load_id: loads[1].id,
        invoice_number: 'INV-DEMO-002',
        invoice_date: oneWeekAgo.toISOString().split('T')[0],
        due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Sent',
        subtotal: 3200.00,
        total: 3200.00,
        amount_paid: 0,
        terms: 'Net 30',
        notes: 'Demo invoice - Awaiting payment'
      }
    ];

    const { error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .insert(demoInvoices);

    if (invoicesError) throw invoicesError;

    // 5. Create demo expenses
    const demoExpenses = [
      {
        user_id: userId,
        vehicle_id: trucks[0].id,
        category: 'Fuel',
        amount: 485.50,
        date: oneWeekAgo.toISOString().split('T')[0],
        description: 'Fuel fill-up at Pilot Travel Center, Dallas',
        payment_method: 'Credit Card',
        deductible: true,
        notes: 'Demo expense - Fuel'
      },
      {
        user_id: userId,
        vehicle_id: trucks[0].id,
        category: 'Maintenance',
        amount: 250.00,
        date: twoWeeksAgo.toISOString().split('T')[0],
        description: 'Oil change and filter at TruckPro',
        payment_method: 'Credit Card',
        deductible: true,
        notes: 'Demo expense - Routine maintenance'
      },
      {
        user_id: userId,
        vehicle_id: trucks[1].id,
        category: 'Fuel',
        amount: 392.75,
        date: now.toISOString().split('T')[0],
        description: 'Fuel fill-up at Love\'s Travel Stop, Atlanta',
        payment_method: 'Fuel Card',
        deductible: true,
        notes: 'Demo expense - Fuel'
      },
      {
        user_id: userId,
        category: 'Insurance',
        amount: 1200.00,
        date: twoWeeksAgo.toISOString().split('T')[0],
        description: 'Monthly insurance premium - Progressive Commercial',
        payment_method: 'Bank Transfer',
        deductible: true,
        notes: 'Demo expense - Business insurance'
      }
    ];

    const { error: expensesError } = await supabaseAdmin
      .from('expenses')
      .insert(demoExpenses);

    if (expensesError) throw expensesError;

    // 6. Create demo fuel entries (for IFTA tracking)
    const demoFuelEntries = [
      {
        user_id: userId,
        vehicle_id: trucks[0].id,
        date: oneWeekAgo.toISOString().split('T')[0],
        gallons: 125.5,
        price_per_gallon: 3.87,
        total_amount: 485.69,
        odometer: 245000,
        state: 'TX',
        state_name: 'Texas',
        location: 'Dallas - Pilot Travel Center',
        fuel_type: 'Diesel',
        is_complete_fill: true,
        payment_method: 'Credit Card',
        notes: 'Demo fuel entry'
      },
      {
        user_id: userId,
        vehicle_id: trucks[0].id,
        date: twoWeeksAgo.toISOString().split('T')[0],
        gallons: 118.2,
        price_per_gallon: 3.92,
        total_amount: 463.34,
        odometer: 244200,
        state: 'GA',
        state_name: 'Georgia',
        location: 'Atlanta - Flying J',
        fuel_type: 'Diesel',
        is_complete_fill: true,
        payment_method: 'Credit Card',
        notes: 'Demo fuel entry'
      },
      {
        user_id: userId,
        vehicle_id: trucks[1].id,
        date: now.toISOString().split('T')[0],
        gallons: 98.5,
        price_per_gallon: 3.99,
        total_amount: 393.02,
        odometer: 156000,
        state: 'GA',
        state_name: 'Georgia',
        location: 'Atlanta - Love\'s Travel Stop',
        fuel_type: 'Diesel',
        is_complete_fill: true,
        payment_method: 'Fuel Card',
        notes: 'Demo fuel entry'
      }
    ];

    const { error: fuelError } = await supabaseAdmin
      .from('fuel_entries')
      .insert(demoFuelEntries);

    if (fuelError) throw fuelError;

    // 7. Mark user as having demo data
    await supabaseAdmin
      .from('users')
      .update({
        has_demo_data: true,
        demo_data_created_at: now.toISOString()
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully',
      seeded: true,
      summary: {
        trucks: trucks.length,
        customers: customers.length,
        loads: loads.length,
        invoices: demoInvoices.length,
        expenses: demoExpenses.length,
        fuelEntries: demoFuelEntries.length
      }
    });

  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json({
      error: 'Failed to seed demo data',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Removes demo data for a user (when they want to start fresh)
 */
export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete in order to respect foreign key constraints

    // Delete fuel entries with demo notes
    await supabaseAdmin
      .from('fuel_entries')
      .delete()
      .eq('user_id', userId)
      .like('notes', '%Demo%');

    // Delete expenses with demo notes
    await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('user_id', userId)
      .like('notes', '%Demo%');

    // Delete invoices (with demo prefix)
    await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('user_id', userId)
      .like('invoice_number', 'INV-DEMO%');

    // Delete loads (with demo prefix)
    await supabaseAdmin
      .from('loads')
      .delete()
      .eq('user_id', userId)
      .like('load_number', 'DEMO%');

    // Delete customers (with demo in notes)
    await supabaseAdmin
      .from('customers')
      .delete()
      .eq('user_id', userId)
      .like('notes', '%Demo%');

    // Delete vehicles (with demo in notes)
    await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('user_id', userId)
      .like('notes', '%Demo%');

    // Update user flag
    await supabaseAdmin
      .from('users')
      .update({ has_demo_data: false })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: 'Demo data removed successfully'
    });

  } catch (error) {
    console.error('Error removing demo data:', error);
    return NextResponse.json({
      error: 'Failed to remove demo data',
      details: error.message
    }, { status: 500 });
  }
}
