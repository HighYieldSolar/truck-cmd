"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/context/LanguageContext";
import {
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Mail,
  Download,
  Info,
  ExternalLink,
  FileText,
  Trash2
} from "lucide-react";
import Link from "next/link";

export default function PrivacySettings() {
  const { t } = useTranslation('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [exportingData, setExportingData] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [confirmExportPassword, setConfirmExportPassword] = useState('');
  const [exportFormat, setExportFormat] = useState('encrypted'); // 'encrypted' or 'plain'

  // Privacy settings - only what's actually used
  const [privacySettings, setPrivacySettings] = useState({
    marketingEmails: true,
    productUpdates: true
  });

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Load privacy settings from user metadata if available
        if (user.user_metadata?.privacy_settings) {
          setPrivacySettings(prev => ({
            ...prev,
            ...user.user_metadata.privacy_settings
          }));
        }

      } catch (error) {
        setErrorMessage(t('privacy.messages.loadFailed'));
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Handle toggle change
  const handleToggle = (setting) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Save privacy settings
  const savePrivacySettings = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const { error } = await supabase.auth.updateUser({
        data: {
          privacy_settings: privacySettings
        }
      });

      if (error) throw error;

      setSuccessMessage(t('privacy.messages.updateSuccess'));

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage(`${t('privacy.messages.updateFailed')}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Encryption helper function using Web Crypto API
  const encryptData = async (data, password) => {
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data, null, 2);
    const dataBuffer = encoder.encode(dataString);

    // Derive a key from the password using PBKDF2
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate IV and encrypt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return combined;
  };

  // Open export modal
  const openExportModal = () => {
    setExportPassword('');
    setConfirmExportPassword('');
    setExportFormat('encrypted');
    setShowExportModal(true);
  };

  // Export user data (CCPA compliance)
  const handleDataExport = async () => {
    // Validate passwords for encrypted export
    if (exportFormat === 'encrypted') {
      if (!exportPassword || exportPassword.length < 8) {
        setErrorMessage(t('privacy.messages.passwordTooShort'));
        return;
      }
      if (exportPassword !== confirmExportPassword) {
        setErrorMessage(t('privacy.messages.passwordsMismatch'));
        return;
      }
    }

    try {
      setExportingData(true);
      setErrorMessage(null);

      // Fetch all user data from various tables
      const userId = user.id;

      const [
        { data: profile },
        { data: loads },
        { data: customers },
        { data: invoices },
        { data: expenses },
        { data: trucks },
        { data: drivers },
        { data: fuelEntries }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('loads').select('*').eq('user_id', userId),
        supabase.from('customers').select('*').eq('user_id', userId),
        supabase.from('invoices').select('*').eq('user_id', userId),
        supabase.from('expenses').select('*').eq('user_id', userId),
        supabase.from('trucks').select('*').eq('user_id', userId),
        supabase.from('drivers').select('*').eq('user_id', userId),
        supabase.from('fuel_entries').select('*').eq('user_id', userId)
      ]);

      // Compile all data
      const exportData = {
        exportDate: new Date().toISOString(),
        accountInfo: {
          email: user.email,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        },
        profile: profile || {},
        businessData: {
          loads: loads || [],
          customers: customers || [],
          invoices: invoices || [],
          expenses: expenses || [],
          trucks: trucks || [],
          drivers: drivers || [],
          fuelEntries: fuelEntries || []
        }
      };

      let blob;
      let filename;

      if (exportFormat === 'encrypted') {
        // Encrypt the data
        const encryptedBuffer = await encryptData(exportData, exportPassword);
        blob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
        filename = `truck-command-data-export-${new Date().toISOString().split('T')[0]}.encrypted`;
      } else {
        // Plain JSON export (user acknowledged the warning)
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `truck-command-data-export-${new Date().toISOString().split('T')[0]}.json`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      setExportPassword('');
      setConfirmExportPassword('');

      setSuccessMessage(
        exportFormat === 'encrypted'
          ? t('privacy.messages.exportEncryptedSuccess')
          : t('privacy.messages.exportPlainSuccess')
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 7000);

    } catch (error) {
      setErrorMessage(t('privacy.messages.exportFailed'));
    } finally {
      setExportingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">{t('privacy.loading')}</span>
      </div>
    );
  }

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      onClick={onChange}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );

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

      {/* Privacy Overview */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Shield size={20} className="mr-2" />
            {t('privacy.yourPrivacy')}
          </h3>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-6">
          <div className="flex items-start">
            <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">{t('privacy.howWeProtect')}</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>{t('privacy.protectionList.encrypted')}</li>
                <li>{t('privacy.protectionList.noSell')}</li>
                <li>{t('privacy.protectionList.essentialCookies')}</li>
                <li>{t('privacy.protectionList.stripePayments')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={savePrivacySettings}>
        {/* Communication Preferences */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Mail size={20} className="mr-2" />
              {t('privacy.emailPreferences')}
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('privacy.emailPreferencesDescription')}
          </p>

          <div className="space-y-4 bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('privacy.productUpdates')}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('privacy.productUpdatesDescription')}
                </p>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <ToggleSwitch
                  enabled={privacySettings.productUpdates}
                  onChange={() => handleToggle('productUpdates')}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t('privacy.promotionalEmails')}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('privacy.promotionalEmailsDescription')}
                  </p>
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  <ToggleSwitch
                    enabled={privacySettings.marketingEmails}
                    onChange={() => handleToggle('marketingEmails')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-8">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                {t('privacy.saving')}
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {t('privacy.savePreferences')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Your Data Rights (CCPA) */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <FileText size={20} className="mr-2" />
            {t('privacy.dataRights')}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('privacy.dataRightsDescription')}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Download Your Data */}
          <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-start mb-4">
              <Download size={24} className="text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{t('privacy.downloadData')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('privacy.downloadDataDescription')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openExportModal}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download size={18} className="mr-2" />
              {t('privacy.exportData')}
            </button>
          </div>

          {/* Delete Your Account */}
          <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-start mb-4">
              <Trash2 size={24} className="text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{t('privacy.deleteAccount')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('privacy.deleteAccountDescription')}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings/account"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 size={18} className="mr-2" />
              {t('privacy.goToAccountSettings')}
            </Link>
          </div>
        </div>
      </div>

      {/* Legal Documents */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white">{t('privacy.legalDocuments')}</h3>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('privacy.legalDocumentsDescription')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/privacy"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('privacy.privacyPolicy')}</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
            <Link
              href="/cookies"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('privacy.cookiePolicy')}</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
            <Link
              href="/terms"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('privacy.termsOfService')}</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
            <Link
              href="/acceptable-use"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{t('privacy.acceptableUsePolicy')}</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Contact for Privacy Concerns */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-start">
          <Shield size={24} className="text-gray-400 dark:text-gray-500 mr-4 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{t('privacy.privacyQuestions')}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {t('privacy.privacyQuestionsDescription')}
            </p>
            <a
              href="mailto:support@truckcommand.com"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              support@truckcommand.com
            </a>
          </div>
        </div>
      </div>

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Download size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                {t('privacy.exportModal.title')}
              </h3>

              <div className="space-y-4">
                {/* Export Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('privacy.exportModal.exportFormat')}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="encrypted"
                        checked={exportFormat === 'encrypted'}
                        onChange={() => setExportFormat('encrypted')}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <Shield size={14} className="mr-1 text-green-500" />
                          {t('privacy.exportModal.encrypted')}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('privacy.exportModal.encryptedDescription')}
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="plain"
                        checked={exportFormat === 'plain'}
                        onChange={() => setExportFormat('plain')}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <AlertCircle size={14} className="mr-1 text-yellow-500" />
                          {t('privacy.exportModal.plainJson')}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('privacy.exportModal.plainJsonDescription')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Password fields for encrypted export */}
                {exportFormat === 'encrypted' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('privacy.exportModal.createPassword')}
                      </label>
                      <input
                        type="password"
                        value={exportPassword}
                        onChange={(e) => setExportPassword(e.target.value)}
                        placeholder={t('privacy.exportModal.passwordPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('privacy.exportModal.confirmPassword')}
                      </label>
                      <input
                        type="password"
                        value={confirmExportPassword}
                        onChange={(e) => setConfirmExportPassword(e.target.value)}
                        placeholder={t('privacy.exportModal.confirmPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start">
                      <AlertCircle size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                      {t('privacy.exportModal.passwordWarning')}
                    </p>
                  </div>
                )}

                {/* Warning for plain export */}
                {exportFormat === 'plain' && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
                      <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      {t('privacy.exportModal.plainWarning')}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common:buttons.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDataExport}
                  disabled={exportingData || (exportFormat === 'encrypted' && (!exportPassword || exportPassword.length < 8 || exportPassword !== confirmExportPassword))}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {exportingData ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      {t('privacy.exportModal.exporting')}
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      {t('privacy.exportModal.export')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
