"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { RefreshCw, Save, User, Camera, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "",
    preferredName: "",
    jobFunction: "",
    personalPreferences: ""
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

        // Set initial profile data from user metadata
        setProfile({
          fullName: user.user_metadata?.full_name || "",
          preferredName: user.user_metadata?.preferred_name || "",
          jobFunction: user.user_metadata?.job_function || "",
          personalPreferences: user.user_metadata?.personal_preferences || ""
        });

        setProfileImage(user.user_metadata?.profile_image || null);

      } catch (error) {
        console.error('Error loading user data:', error);
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
      setProfileImage(data.publicUrl);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setErrorMessage('Failed to upload profile image. Please try again.');
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

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          preferred_name: profile.preferredName,
          job_function: profile.jobFunction,
          personal_preferences: profile.personalPreferences,
          profile_image: profileImage
        }
      });

      if (updateError) throw updateError;

      // Show success message
      setSuccessMessage('Profile updated successfully!');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading your profile...</span>
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

      <form onSubmit={saveProfile}>
        {/* Profile Image */}
        <div className="flex items-center mb-8">
          <div className="relative mr-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
            </div>
            <button
              type="button"
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
            >
              <Camera size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
            <p className="text-sm text-gray-500">Upload a clear photo to help your team recognize you</p>
            {profileImage && (
              <button
                type="button"
                onClick={() => setProfileImage(null)}
                className="mt-1 text-sm text-red-600 hover:text-red-800"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
                Full name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="preferredName">
                What should we call you?
              </label>
              <input
                type="text"
                id="preferredName"
                name="preferredName"
                value={profile.preferredName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your preferred name"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="jobFunction">
              What best describes your work?
            </label>
            <select
              id="jobFunction"
              name="jobFunction"
              value={profile.jobFunction}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="personalPreferences">
              What personal preferences should Claude consider in responses?
            </label>
            <p className="text-xs text-gray-500 mb-2">Your preferences will apply to all conversations, within Anthropic&#39;s guidelines.</p>
            <textarea
              id="personalPreferences"
              name="personalPreferences"
              value={profile.personalPreferences}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. when learning new concepts, I find analogies particularly helpful"
            ></textarea>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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