"use client";

import React, { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle, FileText, AlertCircle, ChevronRight, ChevronLeft, Check, Trash2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";
import { useTranslation } from "@/context/LanguageContext";

export default function ComplianceFormModal({ isOpen, onClose, compliance, onSave, isSubmitting }) {
  const { t } = useTranslation('compliance');
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [hasRestoredData, setHasRestoredData] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    title: "",
    compliance_type: "REGISTRATION",
    status: "Active",
    entity_type: "Vehicle",
    entity_name: "",

    // Step 2: Document Details
    document_number: "",
    issue_date: "",
    expiration_date: "",
    issuing_authority: "",
    document_file: null,
    notes: ""
  });

  // Save to localStorage on form data change
  useEffect(() => {
    if (isOpen && !compliance) {
      localStorage.setItem('complianceFormData', JSON.stringify(formData));
      localStorage.setItem('complianceFormStep', currentStep.toString());
    }
  }, [formData, currentStep, isOpen, compliance]);

  // Load from localStorage on mount
  useEffect(() => {
    if (isOpen && !compliance) {
      const savedData = localStorage.getItem('complianceFormData');
      const savedStep = localStorage.getItem('complianceFormStep');

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (Object.values(parsedData).some(value => value !== '' && value !== null)) {
            setFormData(parsedData);
            setCurrentStep(parseInt(savedStep) || 1);
            setHasRestoredData(true);
          }
        } catch {
          // Silent fail - localStorage data may be corrupted
        }
      }
    } else if (compliance) {
      setFormData({
        title: compliance.title || "",
        compliance_type: compliance.compliance_type || "REGISTRATION",
        entity_type: compliance.entity_type || "Vehicle",
        entity_name: compliance.entity_name || "",
        document_number: compliance.document_number || "",
        issue_date: compliance.issue_date || "",
        expiration_date: compliance.expiration_date || "",
        issuing_authority: compliance.issuing_authority || "",
        notes: compliance.notes || "",
        status: compliance.status || "Active",
        document_file: null
      });
    }
  }, [isOpen, compliance]);

  const clearSavedData = () => {
    localStorage.removeItem('complianceFormData');
    localStorage.removeItem('complianceFormStep');
    setFormData({
      title: "",
      compliance_type: "REGISTRATION",
      status: "Active",
      entity_type: "Vehicle",
      entity_name: "",
      document_number: "",
      issue_date: "",
      expiration_date: "",
      issuing_authority: "",
      document_file: null,
      notes: ""
    });
    setCurrentStep(1);
    setHasRestoredData(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && files?.length > 0) {
      setFormData(prev => ({ ...prev, document_file: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = t('form.validation.titleRequired');
        }
        if (!formData.entity_name.trim()) {
          newErrors.entity_name = t('form.validation.entityNameRequired');
        }
        break;
      case 2:
        if (!formData.expiration_date) {
          newErrors.expiration_date = t('form.validation.expirationRequired');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    // Clear saved data
    if (!compliance) {
      clearSavedData();
    }
    
    onSave(formData);
  };

  const handleClose = () => {
    onClose();
  };

  const steps = [
    { number: 1, title: t('form.steps.basicInfo'), icon: Shield },
    { number: 2, title: t('form.steps.documentDetails'), icon: FileText }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('form.sections.complianceInformation')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.labels.title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`block w-full px-4 py-3 border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                placeholder={t('placeholders.titleExample')}
              />
              {errors.title && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.complianceType')}
                </label>
                <select
                  name="compliance_type"
                  value={formData.compliance_type}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.status')}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Active">{t('status.active')}</option>
                  <option value="Pending">{t('status.pending')}</option>
                  <option value="Expiring Soon">{t('status.expiringSoon')}</option>
                  <option value="Expired">{t('status.expired')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.entityType')}
                </label>
                <select
                  name="entity_type"
                  value={formData.entity_type}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Vehicle">{t('entityTypes.vehicle')}</option>
                  <option value="Driver">{t('entityTypes.driver')}</option>
                  <option value="Company">{t('entityTypes.company')}</option>
                  <option value="Other">{t('entityTypes.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.entityName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="entity_name"
                  value={formData.entity_name}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 border ${errors.entity_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                  placeholder={t('placeholders.entityNameExample')}
                />
                {errors.entity_name && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.entity_name}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('form.sections.documentDetails')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.documentNumber')}
                </label>
                <input
                  type="text"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={t('placeholders.documentNumberExample')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.issuingAuthority')}
                </label>
                <input
                  type="text"
                  name="issuing_authority"
                  value={formData.issuing_authority}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={t('placeholders.issuingAuthorityExample')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.issueDate')}
                </label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.labels.expirationDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="expiration_date"
                  value={formData.expiration_date}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 border ${errors.expiration_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                />
                {errors.expiration_date && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.expiration_date}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.labels.documentFile')}
              </label>
              <input
                type="file"
                name="document_file"
                onChange={handleInputChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 focus:outline-none"
              />
              {formData.document_file && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <CheckCircle size={14} className="text-green-500 dark:text-green-400 mr-1" />
                  {t('form.labels.selectedFile')}: {formData.document_file.name}
                </p>
              )}
              {compliance?.document_url && !formData.document_file && (
                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <FileText size={14} className="text-blue-500 dark:text-blue-400 mr-1" />
                  {t('form.labels.currentDocumentOnFile')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.labels.notes')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                rows="4"
                placeholder={t('placeholders.notesPlaceholder')}
              />
            </div>

            {/* Review Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mt-6 border border-gray-200 dark:border-gray-600">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('form.sections.reviewInformation')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('form.review.title')}:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData.title}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('form.review.type')}:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{COMPLIANCE_TYPES[formData.compliance_type]?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('form.review.entity')}:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData.entity_type} - {formData.entity_name}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('form.review.status')}:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData.status}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('form.review.expiration')}:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData.expiration_date || t('form.review.notSet')}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t('form.review.documentNumber')}:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData.document_number || t('form.review.notProvided')}</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">
              {compliance ? t('form.editTitle') : t('form.createTitle')}
            </h2>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isActive ? '#ffffff' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.3)'
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive ? 'ring-4 ring-white/30' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={20} className="text-white" />
                      ) : (
                        <Icon size={20} className={isActive ? 'text-blue-600' : 'text-white'} />
                      )}
                    </motion.div>
                    <span className={`ml-2 text-sm ${isActive ? 'font-semibold' : ''}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded ${
                      currentStep > step.number ? 'bg-green-400' : 'bg-white/30'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {/* Restored Data Alert */}
        {hasRestoredData && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mx-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="text-blue-500 dark:text-blue-400 mr-2" size={20} />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('messages.restoredProgress')}
                </p>
              </div>
              <button
                onClick={clearSavedData}
                className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 flex items-center gap-1 text-sm"
              >
                <Trash2 size={16} />
                {t('common:buttons.clear')}
              </button>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
          {renderStepContent()}

          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-md mt-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={currentStep === 1 ? handleClose : handlePrevious}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
              disabled={isSubmitting}
            >
              <ChevronLeft size={16} className="mr-2" />
              {currentStep === 1 ? t('common:buttons.cancel') : t('form.buttons.previous')}
            </button>

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center transition-colors"
                disabled={isSubmitting}
              >
                {t('form.buttons.next')}
                <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    {compliance ? t('form.buttons.updating') : t('form.buttons.creating')}
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    {compliance ? t('form.buttons.updateRecord') : t('form.buttons.createRecord')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}