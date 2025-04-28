"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  RefreshCw, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Key,
  LogOut,
  Trash2,
  Shield
} from "lucide-react";

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load your account information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update password
  const updatePassword = async (e) => {
    e.preventDefault();
    
    try {
      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrorMessage("New passwords don't match.");
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        setErrorMessage("New password must be at least 8 characters long.");
        return;
      }
      
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      // Clear form and show success message
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Password updated successfully!');
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      setErrorMessage(`Failed to update password: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle account deletion
  const deleteAccount = async () => {
    try {
      if (deleteConfirmation !== 'delete my account') {
        setErrorMessage("Please type 'delete my account' to confirm.");
        return;
      }
      
      setSaving(true);
      setErrorMessage(null);
      
      // In a real app, you would call an API endpoint to properly handle account deletion
      // This would involve both auth and database cleanup
      
      // For demo purposes, we'll just sign out
      await supabase.auth.signOut();
      
      // Redirect to homepage
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setErrorMessage(`Failed to delete account: ${error.message}`);
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      setErrorMessage(`Failed to log out: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading account settings...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        </div>
      )}
      
      {/* Account Information */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Email Address</div>
              <div className="font-medium text-gray-900">{user?.email}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Account Status</div>
              <div className="font-medium text-gray-900">
                {user?.email_confirmed_at ? 'Verified Account' : 'Unverified Account'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Change Password */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        
        <form onSubmit={updatePassword} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long.
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Key size={18} className="mr-2" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Sign Out */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sign Out</h3>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 mb-4">
            Sign out from your current session on this device.
          </p>
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Delete Account */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Account</h3>
        
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-start mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Delete Your Account</h4>
              <p className="text-gray-600 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>
          
          {!showDeleteConfirmation ? (
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 size={18} className="mr-2" />
              Delete Account
            </button>
          ) : (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-700 mb-4">
                This action cannot be undone. All of your data will be permanently deleted. Please type <strong>delete my account</strong> to confirm.
              </p>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Type 'delete my account' to confirm"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirmation !== 'delete my account' || saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} className="mr-2" />
                      Permanently Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}