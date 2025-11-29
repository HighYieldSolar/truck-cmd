"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { RefreshCw, Save, User, Camera, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "",
    preferredName: "",
    jobFunction: "",
    personalPreferences: "",
    phone: "",
    companyName: ""
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

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

        // Fetch user profile from users table
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // Set profile data from database or user metadata
        setProfile({
          fullName: userData?.full_name || user.user_metadata?.full_name || "",
          preferredName: user.user_metadata?.preferred_name || "",
          jobFunction: user.user_metadata?.job_function || "",
          personalPreferences: user.user_metadata?.personal_preferences || "",
          phone: userData?.phone || "",
          companyName: userData?.company_name || ""
        });

        setProfileImage(userData?.avatar_url || user.user_metadata?.profile_image || null);

      } catch (error) {
        setErrorMessage('Failed to load your profile information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMessage(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-profile-${Date.now()}.${fileExt}`;
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

      const publicUrl = data.publicUrl;

      // Update users table with avatar_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update profile state
      setProfileImage(publicUrl);
      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage('Failed to upload profile image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove profile image
  const handleRemoveImage = async () => {
    try {
      setUploadingImage(true);
      setErrorMessage(null);

      // Update users table to remove avatar_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileImage(null);
      setSuccessMessage('Profile picture removed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage('Failed to remove profile image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Save profile changes
  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          preferred_name: profile.preferredName,
          job_function: profile.jobFunction,
          personal_preferences: profile.personalPreferences
        }
      });

      if (authError) throw authError;

      // Update users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: profile.fullName,
          phone: profile.phone,
          company_name: profile.companyName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Show success message
      setSuccessMessage('Profile updated successfully!');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="dark:text-white">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800 dark:text-green-300">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800 dark:text-red-300">{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={saveProfile}>
        {/* Profile Image */}
        <div className="flex items-center mb-8">
          <div className="relative mr-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-600">
              {uploadingImage ? (
                <RefreshCw size={24} className="animate-spin text-blue-500" />
              ) : profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Picture</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload a clear photo to help your team recognize you</p>
            {profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={uploadingImage}
                className="mt-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="fullName">
                Full name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="preferredName">
                What should we call you?
              </label>
              <input
                type="text"
                id="preferredName"
                name="preferredName"
                value={profile.preferredName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Your preferred name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="phone">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="companyName">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={profile.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Your company name"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="jobFunction">
              What best describes your work?
            </label>
            <select
              id="jobFunction"
              name="jobFunction"
              value={profile.jobFunction}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select your work function</option>
              <option value="owner_operator">Owner Operator</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="fleet_manager">Fleet Manager</option>
              <option value="administrative">Administrative Staff</option>
              <option value="driver">Driver</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="personalPreferences">
              Any additional notes or preferences?
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Share anything that helps us serve you better.</p>
            <textarea
              id="personalPreferences"
              name="personalPreferences"
              value={profile.personalPreferences}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="e.g. preferred communication times, special requirements, etc."
            ></textarea>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
