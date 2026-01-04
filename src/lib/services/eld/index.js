/**
 * ELD Services Index
 *
 * Central export for all ELD-related services.
 */

// Terminal API Client
export { TerminalClient, TerminalError, TerminalAPIError, TerminalAuthError, TerminalRateLimitError } from './terminalClient';
export { createTerminalClient, normalizeDutyStatus, monthToQuarter, quarterToMonths, parseISODate } from './terminalClient';

// Connection Management
export {
  createConnection,
  getConnection,
  getAllConnections,
  disconnectConnection,
  deleteConnection,
  updateConnectionStatus,
  updateLastSync,
  verifyConnection,
  getConnectionStatus,
  getConnectionsNeedingSync,
  createProviderForConnection
} from './eldConnectionService';

// Entity Mapping
export {
  mapVehicle,
  manualMapVehicle,
  mapDriver,
  manualMapDriver,
  getLocalVehicleId,
  getLocalDriverId,
  autoMatchVehicles,
  autoMatchDrivers,
  getMappings,
  deleteMapping
} from './eldMappingService';

// Data Sync
export {
  syncAll,
  syncVehicles,
  syncDrivers,
  syncIftaMileage,
  syncHosLogs,
  syncVehicleLocations,
  syncFaultCodes,
  getSyncHistory,
  getLatestSyncStatus
} from './eldSyncService';

// IFTA Integration
export {
  getEldMileageForQuarter,
  getManualMileageForQuarter,
  getJurisdictionMileage,
  importEldMileageToIfta,
  getEldMileageSummary
} from './eldIftaService';

// HOS Compliance
export {
  getAllDriversHosStatus,
  getDriverHosDetails,
  getAvailableTime,
  checkHosCompliance,
  getHosDashboard,
  HOS_STATUS,
  HOS_LIMITS
} from './eldHosService';

// GPS Tracking
export {
  getAllVehicleLocations,
  getVehicleLocationHistory,
  refreshLocations,
  getVehiclesNearLocation,
  getGpsDashboard
} from './eldGpsService';

// Vehicle Diagnostics
export {
  getDiagnosticsData,
  syncFaultCodes as syncDiagnosticsFaultCodes,
  clearFaultCode
} from './eldDiagnosticsService';
