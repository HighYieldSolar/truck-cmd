/* eslint-disable @next/next/no-img-element */
// src/components/dashboard/SettingsPage.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Truck, 
  Bell, 
  Lock, 
  Shield, 
  Globe, 
  Edit, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon,
  X
} from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState({
    profile: false,
    company: false,
    password: false,
    notifications: false
  });
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    profileImage: null
  });
  const [company, setCompany] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    mcNumber: "",
    dotNumber: "",
    ein: ""
  });
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [notifications, setNotifications] = useState({
    email: {
      invoices: true,
      expenses: true,
      documents: true,
      reminders: true
    },
    sms: {
      invoices: false,
      expenses: false,
      documents: false,
      reminders: true
    },
    app: {
      invoices: true,
      expenses: true,
      documents: true,
      reminders: true
    }
  });

  const [editState, setEditState] = useState({
    profile: false,
    company: false
  });

  const [successMessage, setSuccessMessage] = useState({
    profile: null,
    company: null,
    password: null,
    notifications: null
  });

  const [errorMessage, setErrorMessage] = useState({
    profile: null,
    company: null,
    password: null,
    notifications: null
  });

  const [activeTab, setActiveTab] = useState("profile");

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Set initial profile data from user metadata
        setProfile({
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          jobTitle: user.user_metadata?.job_title || "",
          profileImage: user.user_metadata?.profile_image || null
        });
        
        // Fetch company profile from database
        const { data: companyData, error: companyError } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (!companyError && companyData) {
          setCompany({
            name: companyData.name || "",
            address: companyData.address || "",
            city: companyData.city || "",
            state: companyData.state || "",
            zipCode: companyData.zip_code || "",
            country: companyData.country || "",
            mcNumber: companyData.mc_number || "",
            dotNumber: companyData.dot_number || "",
            ein: companyData.ein || ""
          });
        }
        
        // Fetch notification preferences from database
        const { data: notifData, error: notifError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (!notifError && notifData) {
          setNotifications(notifData.preferences || notifications);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear messages when switching tabs
    setSuccessMessage({
      profile: null,
      company: null,
      password: null,
      notifications: null
    });
    setErrorMessage({
      profile: null,
      company: null,
      password: null,
      notifications: null
    });
  };

  // Toggle edit mode
  const toggleEdit = (section) => {
    setEditState(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Clear messages when toggling edit mode
    setSuccessMessage(prev => ({
      ...prev,
      [section]: null
    }));
    setErrorMessage(prev => ({
      ...prev,
      [section]: null
    }));
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-profile.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update profile state
      setProfile(prev => ({
        ...prev,
        profileImage: data.publicUrl
      }));
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setErrorMessage(prev => ({
        ...prev,
        profile: 'Failed to upload profile image. Please try again.'
      }));
    }
  };

  // Handle input changes for different forms
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (type, setting) => {
    setNotifications(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: !prev[type][setting]
      }
    }));
  };

  // Save profile changes
  const saveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaveLoading(prev => ({ ...prev, profile: true }));
      setSuccessMessage(prev => ({ ...prev, profile: null }));
      setErrorMessage(prev => ({ ...prev, profile: null }));
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          phone: profile.phone,
          job_title: profile.jobTitle,
          profile_image: profile.profileImage
        }
      });
      
      if (updateError) throw updateError;
      
      // Show success message
      setSuccessMessage(prev => ({
        ...prev,
        profile: 'Profile updated successfully!'
      }));
      
      // Exit edit mode
      toggleEdit('profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage(prev => ({
        ...prev,
        profile: `Failed to update profile: ${error.message}`
      }));
    } finally {
      setSaveLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Save company changes
  const saveCompany = async (e) => {
    e.preventDefault();
    
    try {
      setSaveLoading(prev => ({ ...prev, company: true }));
      setSuccessMessage(prev => ({ ...prev, company: null }));
      setErrorMessage(prev => ({ ...prev, company: null }));
      
      // Format company data for database
      const companyData = {
        user_id: user.id,
        name: company.name,
        address: company.address,
        city: company.city,
        state: company.state,
        zip_code: company.zipCode,
        country: company.country,
        mc_number: company.mcNumber,
        dot_number: company.dotNumber,
        ein: company.ein,
        updated_at: new Date()
      };
      
      // Check if company profile already exists
      const { data: existingCompany } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let error;
      
      if (existingCompany) {
        // Update existing company profile
        const { error: updateError } = await supabase
          .from('company_profiles')
          .update(companyData)
          .eq('id', existingCompany.id);
          
        error = updateError;
      } else {
        // Insert new company profile
        const { error: insertError } = await supabase
          .from('company_profiles')
          .insert([{
            ...companyData,
            created_at: new Date()
          }]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      // Show success message
      setSuccessMessage(prev => ({
        ...prev,
        company: 'Company information updated successfully!'
      }));
      
      // Exit edit mode
      toggleEdit('company');
    } catch (error) {
      console.error('Error saving company information:', error);
      setErrorMessage(prev => ({
        ...prev,
        company: `Failed to update company information: ${error.message}`
      }));
    } finally {
      setSaveLoading(prev => ({ ...prev, company: false }));
    }
  };

  // Change password
  const changePassword = async (e) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (password.new !== password.confirm) {
        setErrorMessage(prev => ({
          ...prev,
          password: 'New passwords do not match.'
        }));
        return;
      }
      
      if (password.new.length < 8) {
        setErrorMessage(prev => ({
          ...prev,
          password: 'Password must be at least 8 characters long.'
        }));
        return;
      }
      
      setSaveLoading(prev => ({ ...prev, password: true }));
      setSuccessMessage(prev => ({ ...prev, password: null }));
      setErrorMessage(prev => ({ ...prev, password: null }));
      
      // Change password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password.new
      });
      
      if (error) throw error;
      
      // Show success message
      setSuccessMessage(prev => ({
        ...prev,
        password: 'Password changed successfully!'
      }));
      
      // Clear password fields
      setPassword({
        current: "",
        new: "",
        confirm: ""
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setErrorMessage(prev => ({
        ...prev,
        password: `Failed to change password: ${error.message}`
      }));
    } finally {
      setSaveLoading(prev => ({ ...prev, password: false }));
    }
  };

  // Save notification preferences
  const saveNotifications = async (e) => {
    e.preventDefault();
    
    try {
      setSaveLoading(prev => ({ ...prev, notifications: true }));
      setSuccessMessage(prev => ({ ...prev, notifications: null }));
      setErrorMessage(prev => ({ ...prev, notifications: null }));
      
      // Check if notification preferences exist
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let error;
      
      if (existingPrefs) {
        // Update existing preferences
        const { error: updateError } = await supabase
          .from('notification_preferences')
          .update({
            preferences: notifications,
            updated_at: new Date()
          })
          .eq('id', existingPrefs.id);
          
        error = updateError;
      } else {
        // Insert new preferences
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert([{
            user_id: user.id,
            preferences: notifications,
            created_at: new Date(),
            updated_at: new Date()
          }]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      // Show success message
      setSuccessMessage(prev => ({
        ...prev,
        notifications: 'Notification preferences updated successfully!'
      }));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setErrorMessage(prev => ({
        ...prev,
        notifications: `Failed to update notification preferences: ${error.message}`
      }));
    } finally {
      setSaveLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  // Display loading state while fetching user data
  if (loading) {
    return (
      <DashboardLayout activePage="settings">
        <div className="flex items-center justify-center h-full p-8">
          <div className="flex flex-col items-center">
            <RefreshCw size={40} className="animate-spin text-blue-500 mb-4" />
            <p className="text-lg text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="settings">
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Settings Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800">Account Settings</h2>
              <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
            </div>

            {/* Settings Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => handleTabChange("profile")}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "profile"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <User size={16} className="inline-block mr-2" />
                  Personal Information
                </button>
                <button
                  onClick={() => handleTabChange("company")}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "company"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Building size={16} className="inline-block mr-2" />
                  Company Profile
                </button>
                <button
                  onClick={() => handleTabChange("password")}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "password"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Lock size={16} className="inline-block mr-2" />
                  Password & Security
                </button>
                <button
                  onClick={() => handleTabChange("notifications")}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "notifications"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Bell size={16} className="inline-block mr-2" />
                  Notifications
                </button>
              </nav>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                    <button
                      onClick={() => toggleEdit("profile")}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {editState.profile ? (
                        <>
                          <X size={16} className="mr-1" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit size={16} className="mr-1" />
                          Edit
                        </>
                      )}
                    </button>
                  </div>

                  {/* Success/Error Messages */}
                  {successMessage.profile && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-700">{successMessage.profile}</span>
                      </div>
                    </div>
                  )}

                  {errorMessage.profile && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-700">{errorMessage.profile}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={saveProfile}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Profile image (left column) */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {profile.profileImage ? (
                            <img
                              src={profile.profileImage}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={64} className="text-gray-400" />
                          )}
                        </div>
                        
                        {editState.profile && (
                          <div>
                            <label htmlFor="profile-upload" className="cursor-pointer block text-center text-sm font-medium text-blue-600 hover:text-blue-500">
                              Change Photo
                              <input
                                id="profile-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleProfileImageUpload}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    
                      {/* Profile fields (right column) */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            {editState.profile ? (
                              <input
                                type="text"
                                name="fullName"
                                value={profile.fullName}
                                onChange={handleProfileChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                              />
                            ) : (
                              <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                                {profile.fullName || "Not set"}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                              {profile.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Contact support to change your email address
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            {editState.profile ? (
                              <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleProfileChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            ) : (
                              <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                                {profile.phone || "Not set"}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Job Title
                            </label>
                            {editState.profile ? (
                              <input
                                type="text"
                                name="jobTitle"
                                value={profile.jobTitle}
                                onChange={handleProfileChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            ) : (
                              <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                                {profile.jobTitle || "Not set"}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {editState.profile && (
                          <div className="flex justify-end pt-4">
                            <button
                              type="submit"
                              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              disabled={saveLoading.profile}
                            >
                              {saveLoading.profile ? (
                                <>
                                  <RefreshCw size={16} className="animate-spin mr-2" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save size={16} className="mr-2" />
                                  Save Changes
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Company Tab */}
              {activeTab === "company" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                    <button
                      onClick={() => toggleEdit("company")}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {editState.company ? (
                        <>
                          <X size={16} className="mr-1" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit size={16} className="mr-1" />
                          Edit
                        </>
                      )}
                    </button>
                  </div>

                  {/* Success/Error Messages */}
                  {successMessage.company && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-700">{successMessage.company}</span>
                      </div>
                    </div>
                  )}

                  {errorMessage.company && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-700">{errorMessage.company}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={saveCompany}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="name"
                            value={company.name}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.name || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="address"
                            value={company.address}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.address || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="city"
                            value={company.city}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.city || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State / Province
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="state"
                            value={company.state}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.state || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP / Postal Code
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="zipCode"
                            value={company.zipCode}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.zipCode || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="country"
                            value={company.country}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.country || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DOT Number
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="dotNumber"
                            value={company.dotNumber}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.dotNumber || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MC Number
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="mcNumber"
                            value={company.mcNumber}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.mcNumber || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          EIN / Tax ID
                        </label>
                        {editState.company ? (
                          <input
                            type="text"
                            name="ein"
                            value={company.ein}
                            onChange={handleCompanyChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm py-2 border-b border-gray-200">
                            {company.ein || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>

                    {editState.company && (
                      <div className="flex justify-end mt-6">
                        <button
                          type="submit"
                          className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                          disabled={saveLoading.company}
                        >
                          {saveLoading.company ? (
                            <>
                              <RefreshCw size={16} className="animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Password & Security</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Update your password and manage your account security settings
                    </p>
                  </div>

                  {/* Success/Error Messages */}
                  {successMessage.password && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-700">{successMessage.password}</span>
                      </div>
                    </div>
                  )}

                  {errorMessage.password && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-700">{errorMessage.password}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={changePassword} className="max-w-md">
                    <div className="space-y-4">
                      <div>
                        <label 
                          htmlFor="current-password" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Current Password
                        </label>
                        <input
                          id="current-password"
                          name="current"
                          type="password"
                          value={password.current}
                          onChange={handlePasswordChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label 
                          htmlFor="new-password" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          New Password
                        </label>
                        <input
                          id="new-password"
                          name="new"
                          type="password"
                          value={password.new}
                          onChange={handlePasswordChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Password must be at least 8 characters long.
                        </p>
                      </div>
                      
                      <div>
                        <label 
                          htmlFor="confirm-password" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Confirm New Password
                        </label>
                        <input
                          id="confirm-password"
                          name="confirm"
                          type="password"
                          value={password.confirm}
                          onChange={handlePasswordChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        type="submit"
                        className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        disabled={saveLoading.password}
                      >
                        {saveLoading.password ? (
                          <>
                            <RefreshCw size={16} className="animate-spin mr-2" />
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <Lock size={16} className="mr-2" />
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Security Settings Section */}
                  <div className="mt-10 pt-10 border-t border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h4>
                    
                    {/* 2FA Setting - Placeholder for future implementation */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                    
                    {/* Session History - Placeholder for future implementation */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Session History</p>
                        <p className="text-xs text-gray-500 mt-1">
                          View and manage your active sessions
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-500"
                          disabled={true}
                        >
                          View Sessions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage how and when you receive notifications
                    </p>
                  </div>

                  {/* Success/Error Messages */}
                  {successMessage.notifications && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-700">{successMessage.notifications}</span>
                      </div>
                    </div>
                  )}

                  {errorMessage.notifications && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-700">{errorMessage.notifications}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={saveNotifications}>
                    <div className="overflow-hidden bg-white shadow sm:rounded-md">
                      <div className="bg-gray-50 p-4 sm:px-6">
                        <h4 className="text-base font-medium text-gray-900">Email Notifications</h4>
                      </div>
                      <ul role="list" className="divide-y divide-gray-200">
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Invoice Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive notifications for invoice status changes</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.email.invoices}
                                  onChange={() => handleNotificationChange('email', 'invoices')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Expense Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive notifications about expenses</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.email.expenses}
                                  onChange={() => handleNotificationChange('email', 'expenses')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Document Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive notifications about document updates</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.email.documents}
                                  onChange={() => handleNotificationChange('email', 'documents')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Reminders</p>
                              <p className="text-xs text-gray-500 mt-1">Receive reminders for upcoming deadlines</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.email.reminders}
                                  onChange={() => handleNotificationChange('email', 'reminders')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="overflow-hidden bg-white shadow sm:rounded-md mt-6">
                      <div className="bg-gray-50 p-4 sm:px-6">
                        <h4 className="text-base font-medium text-gray-900">SMS Notifications</h4>
                      </div>
                      <ul role="list" className="divide-y divide-gray-200">
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Invoice Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive SMS alerts for invoices</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.sms.invoices}
                                  onChange={() => handleNotificationChange('sms', 'invoices')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Expense Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive SMS alerts about expenses</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.sms.expenses}
                                  onChange={() => handleNotificationChange('sms', 'expenses')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Document Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive SMS alerts about document updates</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.sms.documents}
                                  onChange={() => handleNotificationChange('sms', 'documents')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Reminders</p>
                              <p className="text-xs text-gray-500 mt-1">Receive SMS reminders for upcoming deadlines</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.sms.reminders}
                                  onChange={() => handleNotificationChange('sms', 'reminders')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="overflow-hidden bg-white shadow sm:rounded-md mt-6">
                      <div className="bg-gray-50 p-4 sm:px-6">
                        <h4 className="text-base font-medium text-gray-900">In-App Notifications</h4>
                      </div>
                      <ul role="list" className="divide-y divide-gray-200">
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Invoice Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive in-app notifications for invoices</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.app.invoices}
                                  onChange={() => handleNotificationChange('app', 'invoices')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Expense Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive in-app notifications about expenses</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.app.expenses}
                                  onChange={() => handleNotificationChange('app', 'expenses')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Document Notifications</p>
                              <p className="text-xs text-gray-500 mt-1">Receive in-app notifications about document updates</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.app.documents}
                                  onChange={() => handleNotificationChange('app', 'documents')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Reminders</p>
                              <p className="text-xs text-gray-500 mt-1">Receive in-app reminders for upcoming deadlines</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.app.reminders}
                                  onChange={() => handleNotificationChange('app', 'reminders')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        disabled={saveLoading.notifications}
                      >
                        {saveLoading.notifications ? (
                          <>
                            <RefreshCw size={16} className="animate-spin mr-2" />
                            Saving Preferences...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Preferences
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}