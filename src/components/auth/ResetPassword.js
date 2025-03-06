"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  registerUser, 
  loginUser, 
  getCurrentUser, 
  resetPassword,
  logoutUser,
  updateUserProfile
} from "@/lib/supabaseAuth";

// Example component showing usage of the Supabase Auth utility
export default function ExampleAuthComponent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    async function checkUser() {
      setLoading(true);
      const { user, error } = await getCurrentUser();
      
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || "");
        setBusinessName(user.user_metadata?.business_name || "");
      } else if (error) {
        console.error("Error fetching user:", error);
      }
      
      setLoading(false);
    }
    
    checkUser();
  }, []);

  // Example of user registration
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Gather user metadata
    const metadata = {
      full_name: fullName,
      business_name: businessName,
      // Add any other profile data you want to store
    };

    // Call the registerUser function from our utility
    const { data, error } = await registerUser(email, password, metadata);

    if (error) {
      setError(error.message);
    } else {
      // Redirect to a verification page
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    }

    setLoading(false);
  };

  // Example of user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Call the loginUser function from our utility
    const { data, error } = await loginUser(email, password);

    if (error) {
      setError(error.message);
    } else if (data.user) {
      setUser(data.user);
      router.push("/dashboard");
    }

    setLoading(false);
  };

  // Example of password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Call the resetPassword function from our utility
    const { error } = await resetPassword(email, `${window.location.origin}/reset-password`);

    if (error) {
      setError(error.message);
    } else {
      // Redirect to confirmation page
      router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
    }

    setLoading(false);
  };

  // Example of user logout
  const handleLogout = async () => {
    setLoading(true);

    // Call the logoutUser function from our utility
    const { error } = await logoutUser();

    if (error) {
      console.error("Error logging out:", error);
    } else {
      setUser(null);
      router.push("/login");
    }

    setLoading(false);
  };

  // Example of profile update
  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await updateUserProfile({
      full_name: fullName,
      business_name: businessName,
    });

    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      alert("Profile updated successfully!");
    }

    setLoading(false);
  };

  // Show different UI based on whether user is logged in
  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Welcome, {user.user_metadata?.full_name || user.email}</h2>
        
        <div className="mb-8">
          <p className="text-gray-600">Email: {user.email}</p>
          <p className="text-gray-600">Business: {user.user_metadata?.business_name || "Not specified"}</p>
        </div>
        
        <h3 className="text-lg font-semibold mb-4">Update Profile</h3>
        
        <form onSubmit={updateProfile} className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2 border rounded bg-gray-200"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-2 border rounded bg-gray-200"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
        
        <button 
          onClick={handleLogout}
          disabled={loading}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Authentication Example</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded bg-gray-200"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded bg-gray-200"
          />
        </div>
        
        {/* Only show these fields when in signup mode */}
        <div>
          <label className="block text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded bg-gray-200"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-2 border rounded bg-gray-200"
          />
        </div>
      </div>
      
      <div className="space-y-3 mt-6">
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        <button 
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          {loading ? "Creating account..." : "Signup"}
        </button>
        
        <button 
          onClick={handlePasswordReset}
          disabled={loading}
          className="w-full bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
        >
          {loading ? "Sending..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}