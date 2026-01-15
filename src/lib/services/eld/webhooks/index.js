/**
 * ELD Webhook Services - Index
 *
 * Re-exports all webhook-related services for easy importing.
 */

// Signature validation
export {
  validateMotiveSignature,
  validateSamsaraSignature,
  isTimestampValid,
  validateWebhook,
} from './webhookSignatureService';

// Event handlers
export {
  handleMotiveLocationUpdated,
  handleSamsaraVehicleStats,
  handleMotiveHosUpdate,
  handleSamsaraHosUpdate,
  handleMotiveFaultCode,
  handleSamsaraFaultCode,
  logWebhookEvent,
  lookupOrganization,
} from './webhookEventHandlers';

// Jurisdiction detection for IFTA
export {
  getJurisdictionFromCoordinates,
  getJurisdictionName,
  isCanadianProvince,
  calculateDistanceMiles,
  detectJurisdictionCrossing,
  calculateJurisdictionMileage,
  updateIFTAMileage,
  getCurrentIFTAQuarter,
  getIFTAQuarterForDate,
  storeGPSBreadcrumb,
  getRecentBreadcrumbs,
  getLastKnownLocation,
  US_STATE_BOUNDS,
  CA_PROVINCE_BOUNDS,
} from './jurisdictionDetectionService';

// Webhook registration
export {
  registerMotiveWebhook,
  listMotiveWebhooks,
  updateMotiveWebhook,
  deleteMotiveWebhook,
  registerSamsaraWebhook,
  listSamsaraWebhooks,
  updateSamsaraWebhook,
  deleteSamsaraWebhook,
  registerWebhooksForConnection,
  unregisterWebhooksForConnection,
  verifyWebhookEndpoint,
  getWebhookEndpoint,
  MOTIVE_WEBHOOK_EVENTS,
  SAMSARA_WEBHOOK_EVENTS,
} from './webhookRegistrationService';
