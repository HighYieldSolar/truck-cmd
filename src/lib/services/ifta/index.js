/**
 * IFTA Services Index
 *
 * Centralized exports for all IFTA-related services
 */

// Core jurisdiction services
export {
  getJurisdictions,
  getJurisdictionForCoordinate,
  getJurisdictionsForCoordinates,
  storeBreadcrumb,
  storeBreadcrumbsBatch,
  processJurisdictionCrossings,
  getUnprocessedCrossings,
  getVehicleCrossings,
  markCrossingsProcessed,
  getAutomatedMileageSummary,
  calculateMileageFromCrossings,
  getRecentBreadcrumbs,
  getGpsTrail,
  getQuarterFromDate,
  getQuarterDateRange,
  US_IFTA_JURISDICTIONS,
  CANADIAN_IFTA_JURISDICTIONS,
  NON_IFTA_JURISDICTIONS
} from './jurisdictionService';

// GPS processing services
export {
  processGPSLocation,
  processGPSLocationBatch,
  processPendingCrossings,
  updateVehicleIFTAMileage,
  getIFTASummaryWithAutomated,
  importAutomatedToIFTA,
  getGPSTrailSummary
} from './gpsProcessingService';

// Boundary loading (admin/setup)
export {
  loadUSStateBoundaries,
  loadCanadianProvinceBoundaries,
  loadAllBoundaries,
  checkBoundariesLoaded,
  getBoundaryStatus
} from './jurisdictionBoundaryLoader';
