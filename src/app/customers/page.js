'use client';
import { useEffect, useState } from 'react';


export default function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const db = await connectDB();
      const customersData = await db.collection('customers').find().toArray();
      setCustomers(customersData);
    };
    fetchCustomers();
  }, []);

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold'>Customers</h1>
      <ul>
        {customers.map((customer) => (
          <li key={customer._id}>{customer.name} - {customer.email}</li>
        ))}
      </ul>
    </div>
  );
}