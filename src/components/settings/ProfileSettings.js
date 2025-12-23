"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSubscription } from "@/context/SubscriptionContext";
import { useTranslation } from "@/context/LanguageContext";
import { RefreshCw, Save, User, Camera, CheckCircle, AlertCircle, Info, Sparkles } from "lucide-react";

export default function ProfileSettings() {
  const { updateUserProfile } = useSubscription();
  const { t } = useTranslation('settings');
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
    companyName: "",
    address: "",
    city: "",
    state: "",
    zip: ""
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const fileInputRef = useRef(null);

  // Check if essential profile fields are complete
  const isProfileComplete = profile.phone && profile.companyName;

  // Format phone number to (555) 555-5555 format
  const formatPhoneNumber = (value) => {
    if (!value) return "";

    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');

    // Format based on length
    if (phoneNumber.length === 0) return "";
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  // Handle phone input with formatting
  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setProfile(prev => ({
      ...prev,
      phone: formattedPhone
    }));
  };

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
          phone: formatPhoneNumber(userData?.phone || ""),
          companyName: userData?.company_name || "",
          address: userData?.address || "",
          city: userData?.city || "",
          state: userData?.state || "",
          zip: userData?.zip || ""
        });

        setProfileImage(userData?.avatar_url || user.user_metadata?.profile_image || null);

        // Check if user is new (missing essential fields)
        if (!userData?.phone || !userData?.company_name) {
          setIsNewUser(true);
        }

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
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

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
      // Update the global context so navbar updates immediately
      updateUserProfile({ avatarUrl: publicUrl });
      setSuccessMessage(t('profile.messages.profilePictureUpdated'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(t('profile.messages.failedToUpload'));
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
      // Update the global context so navbar updates immediately
      updateUserProfile({ avatarUrl: null });
      setSuccessMessage(t('profile.messages.profilePictureRemoved'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(t('profile.messages.failedToRemove'));
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

      // Update users table - store phone as digits only for consistency
      const rawPhone = profile.phone.replace(/\D/g, '');
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: profile.fullName,
          phone: rawPhone,
          company_name: profile.companyName,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Show success message
      setSuccessMessage(t('profile.messages.profileUpdated'));

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage(`${t('profile.messages.failedToUpdate')}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">{t('profile.messages.loading')}</span>
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

      {/* Setup Progress Banner for New Users */}
      {isNewUser && !isProfileComplete && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {t('profile.completeProfile.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('profile.completeProfile.description')}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  {profile.phone ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  {t('profile.completeProfile.phoneNumber')}
                </span>
                <span className="flex items-center gap-1.5">
                  {profile.companyName ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  {t('profile.completeProfile.companyName')}
                </span>
              </div>
            </div>
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
                <img
                  src={profileImage}
                  alt="Profile"
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.profilePicture')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.photoHelp')}</p>
            {profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={uploadingImage}
                className="mt-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
              >
                {t('profile.removePhoto')}
              </button>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">{t('profile.personalInfo')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="fullName">
                {t('profile.fields.fullName')}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t('profile.placeholders.fullName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="preferredName">
                {t('profile.fields.preferredName')}
              </label>
              <input
                type="text"
                id="preferredName"
                name="preferredName"
                value={profile.preferredName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t('profile.placeholders.preferredName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="phone">
                {t('profile.fields.phone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handlePhoneChange}
                maxLength={14}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                  !profile.phone && isNewUser
                    ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('profile.placeholders.phone')}
              />
              {!profile.phone && isNewUser && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">{t('profile.requiredForInvoices')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="companyName">
                {t('profile.fields.companyName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={profile.companyName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                  !profile.companyName && isNewUser
                    ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('profile.placeholders.companyName')}
              />
              {!profile.companyName && isNewUser && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">{t('profile.requiredForInvoices')}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="jobFunction">
              {t('profile.fields.jobFunction')}
            </label>
            <select
              id="jobFunction"
              name="jobFunction"
              value={profile.jobFunction}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('profile.jobFunctions.select')}</option>
              <option value="owner_operator">{t('profile.jobFunctions.ownerOperator')}</option>
              <option value="dispatcher">{t('profile.jobFunctions.dispatcher')}</option>
              <option value="fleet_manager">{t('profile.jobFunctions.fleetManager')}</option>
              <option value="administrative">{t('profile.jobFunctions.administrative')}</option>
              <option value="driver">{t('profile.jobFunctions.driver')}</option>
              <option value="other">{t('profile.jobFunctions.other')}</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="personalPreferences">
              {t('profile.fields.personalPreferences')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('profile.fields.preferencesHelp')}</p>
            <textarea
              id="personalPreferences"
              name="personalPreferences"
              value={profile.personalPreferences}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={t('profile.placeholders.preferences')}
            ></textarea>
          </div>
        </div>

        {/* Business Address */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-600 to-green-500 dark:from-green-700 dark:to-green-600 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">{t('profile.businessAddress')}</h3>
            <p className="text-green-100 text-sm">{t('profile.addressNote')}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="address">
              {t('profile.fields.address')}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={profile.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={t('profile.placeholders.address')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="city">
                {t('profile.fields.city')}
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={profile.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t('profile.placeholders.city')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="state">
                {t('profile.fields.state')}
              </label>
              <select
                id="state"
                name="state"
                value={profile.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('profile.selectState')}</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
                <option value="DC">District of Columbia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="zip">
                {t('profile.fields.zip')}
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={profile.zip}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t('profile.placeholders.zip')}
              />
            </div>
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
                {t('profile.messages.saving')}
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {t('common:buttons.saveChanges')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
