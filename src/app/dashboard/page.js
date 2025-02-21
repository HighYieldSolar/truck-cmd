'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold'>Welcome, {user?.email}</h1>
    </div>
  );
}