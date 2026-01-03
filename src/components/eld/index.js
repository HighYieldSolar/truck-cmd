/**
 * ELD Components Index
 *
 * Central export for all ELD-related UI components.
 * Supports direct OAuth integrations with Motive and Samsara.
 */

// Connection Management
export { default as ELDConnectionManager } from './ELDConnectionManager';
export { default as ProviderSelectButton } from './ProviderSelectButton';
export { default as ELDSyncStatus } from './ELDSyncStatus';

// Legacy - deprecated, use ProviderSelectButton instead
export { default as TerminalLinkButton } from './TerminalLinkButton';

// HOS Compliance
export { default as HOSDashboard } from './HOSDashboard';
export { default as HOSComplianceAlerts } from './HOSComplianceAlerts';

// GPS Tracking (Fleet+ tier)
export { default as GPSTrackingMap } from './GPSTrackingMap';

// Vehicle Diagnostics (Fleet+ tier)
export { default as VehicleDiagnostics } from './VehicleDiagnostics';
