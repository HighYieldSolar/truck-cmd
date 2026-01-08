"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/context/LanguageContext";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Mail,
  Key,
  LogOut,
  Trash2,
  Shield,
  ExternalLink,
  Edit2
} from "lucide-react";
import Link from "next/link";

export default function AccountSettings() {
  const { t } = useTranslation('settings');
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
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);

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
        setErrorMessage(t('account.messages.loadFailed'));
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
      // Validate current password is provided
      if (!passwordData.currentPassword) {
        setErrorMessage(t('account.messages.enterCurrentPassword'));
        return;
      }

      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrorMessage(t('account.messages.passwordsMismatch'));
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setErrorMessage(t('account.messages.passwordTooShort'));
        return;
      }

      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        setErrorMessage(t('account.messages.incorrectPassword'));
        setSaving(false);
        return;
      }

      // Now update to the new password
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

      setSuccessMessage(t('account.messages.passwordUpdated'));

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage(`${t('account.messages.passwordUpdateFailed')}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle account deletion
  const deleteAccount = async () => {
    try {
      if (deleteConfirmation !== 'delete my account') {
        setErrorMessage(t('account.messages.deleteConfirmRequired'));
        return;
      }

      setSaving(true);
      setErrorMessage(null);

      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setErrorMessage(t('account.messages.sessionExpired'));
        setSaving(false);
        return;
      }

      // Call the delete account API
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }

      // Sign out locally and redirect
      await supabase.auth.signOut();
      window.location.href = '/?deleted=true';

    } catch (error) {
      setErrorMessage(`${t('account.messages.deleteAccountFailed')}: ${error.message}`);
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      setErrorMessage(`${t('account.messages.logoutFailed')}: ${error.message}`);
    }
  };

  // Handle email change
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setErrorMessage(t('account.messages.invalidEmail'));
      return;
    }

    // Check if new email is different
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      setErrorMessage(t('account.messages.sameEmail'));
      return;
    }

    try {
      setEmailChangeLoading(true);

      // Update email using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      // Show success message
      setEmailChangeSuccess(true);
      setSuccessMessage(t('account.messages.emailConfirmationSent'));

      // Reset form after a delay
      setTimeout(() => {
        setShowEmailChange(false);
        setNewEmail('');
        setEmailChangeSuccess(false);
      }, 10000);

    } catch (error) {
      if (error.message.includes('rate limit')) {
        setErrorMessage(t('account.messages.emailRateLimit'));
      } else if (error.message.includes('already registered')) {
        setErrorMessage(t('account.messages.emailInUse'));
      } else {
        setErrorMessage(`${t('account.messages.emailChangeFailed')}: ${error.message}`);
      }
    } finally {
      setEmailChangeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">{t('account.loading')}</span>
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

      {/* Account Information */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white">{t('account.accountInfo')}</h3>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('account.email')}</div>
              <div className="font-medium text-gray-900 dark:text-white">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center">
            <Shield className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('account.accountStatus')}</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {user?.email_confirmed_at ? (
                  <span className="inline-flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle size={16} className="mr-1" />
                    {t('account.verifiedAccount')}
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400">{t('account.unverifiedAccount')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white">{t('account.changeEmail')}</h3>
        </div>

        <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-4 sm:p-6">
          {!showEmailChange ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Mail size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('account.currentEmail')}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailChange(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Edit2 size={16} className="mr-2" />
                {t('account.changeEmail')}
              </button>
            </div>
          ) : emailChangeSuccess ? (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300">{t('account.confirmationSent')}</h4>
                  <p className="text-green-700 dark:text-green-400 mt-1 text-sm">
                    {t('account.checkInbox')} <strong className="break-all">{newEmail}</strong>.
                  </p>
                  <p className="text-green-700 dark:text-green-400 mt-1 text-sm">
                    {t('account.checkInboxInstructions')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailChange}>
              {/* Current email display */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('account.currentEmail')}</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm break-all">{user?.email}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="newEmail">
                  {t('account.newEmailAddress')}
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('account.enterNewEmail')}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('account.verifyNewEmail')}
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailChange(false);
                    setNewEmail('');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  {t('common:buttons.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={emailChangeLoading || !newEmail}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {emailChangeLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      {t('account.sendingConfirmation')}
                    </>
                  ) : (
                    <>
                      <Mail size={16} className="mr-2" />
                      {t('account.sendConfirmation')}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white">{t('account.changePassword')}</h3>
        </div>

        <form onSubmit={updatePassword} className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="currentPassword">
              {t('account.currentPassword')}
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="newPassword">
              {t('account.newPassword')}
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('account.passwordMinLength')}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirmPassword">
              {t('account.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  {t('account.updatingPassword')}
                </>
              ) : (
                <>
                  <Key size={18} className="mr-2" />
                  {t('account.updatePassword')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sign Out */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white">{t('account.signOut')}</h3>
        </div>

        <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('account.signOutDescription')}
          </p>

          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <LogOut size={18} className="mr-2" />
            {t('account.signOut')}
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div>
        <div className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white">{t('account.deleteAccount')}</h3>
        </div>

        <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-red-200 dark:border-red-900/50 p-6">
          <div className="flex items-start mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{t('account.deleteYourAccount')}</h4>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {t('account.deleteAccountDescription')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('account.reviewPolicies')}{' '}
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">{t('account.termsOfService')}</Link>
                {' '}{t('account.and')}{' '}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">{t('account.privacyPolicy')}</Link>
                {' '}{t('account.policyInfo')}
              </p>
            </div>
          </div>

          {!showDeleteConfirmation ? (
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 size={18} className="mr-2" />
              {t('account.deleteAccount')}
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300 mb-4">
                {t('account.deleteWarning')} <strong>{t('account.typeToConfirm')}</strong> {t('account.toConfirm')}
              </p>

              <div className="mb-4">
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('account.confirmDeletePlaceholder')}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setDeleteConfirmation('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  {t('common:buttons.cancel')}
                </button>

                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirmation !== 'delete my account' || saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin mr-2" />
                      {t('account.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} className="mr-2" />
                      {t('account.permanentlyDelete')}
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
