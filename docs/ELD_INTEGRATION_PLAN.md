# Comprehensive ELD API Integration Plan

## Executive Summary

This document outlines a complete strategy for integrating Motive and Samsara ELD APIs into Truck Command to automate IFTA state mileage tracking, enable real-time HOS monitoring, provide live fleet tracking, and support a companion mobile app for drivers. The plan is designed to scale from small owner-operators to large fleets with 100+ trucks.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [System Architecture](#2-system-architecture)
3. [Webhook Integration](#3-webhook-integration)
4. [Automated IFTA Mileage System](#4-automated-ifta-mileage-system)
5. [Real-Time HOS Tracking](#5-real-time-hos-tracking)
6. [Live Fleet Tracking Map](#6-live-fleet-tracking-map)
7. [Mobile Driver App](#7-mobile-driver-app)
8. [Big Fleet Scalability](#8-big-fleet-scalability)
9. [Database Schema Additions](#9-database-schema-additions)
10. [API Endpoints](#10-api-endpoints)
11. [User Flows](#11-user-flows)
12. [Implementation Phases](#12-implementation-phases)
13. [Cost Estimates](#13-cost-estimates)

---

## 1. Current State Analysis

### What's Already Built

Your app already has a solid foundation for ELD integration:

#### ELD Provider Architecture
```
src/lib/services/eld/
├── providers/
│   ├── baseProvider.js      # Abstract interface with standard data models
│   ├── motiveProvider.js    # Motive (KeepTruckin) implementation
│   └── samsaraProvider.js   # Samsara implementation
├── eldConnectionService.js   # OAuth connection management
├── eldSyncService.js         # Data synchronization
├── eldGpsService.js          # GPS location tracking
├── eldHosService.js          # HOS status tracking
└── eldIftaService.js         # IFTA data from ELD
```

#### Database Tables (Already Exist)
- `eld_connections` - OAuth tokens and connection status
- `eld_vehicle_locations` - GPS breadcrumb history
- `eld_hos_logs` - Individual duty status entries
- `eld_hos_daily_logs` - Daily HOS summaries
- `eld_ifta_mileage` - Jurisdiction mileage by month
- `eld_fault_codes` - Vehicle diagnostic codes
- `eld_entity_mappings` - Link ELD entities to local records

#### Provider Capabilities Matrix

| Feature | Motive | Samsara | Status |
|---------|--------|---------|--------|
| OAuth 2.0 | ✅ | ✅ | Implemented |
| Vehicles | ✅ | ✅ | Implemented |
| Drivers | ✅ | ✅ | Implemented |
| GPS Locations | ✅ | ✅ | Implemented |
| GPS History | ✅ | ✅ | Implemented |
| HOS Logs | ✅ | ✅ | Implemented |
| IFTA Trips | ✅ `/v1/ifta/trips` | ✅ Jurisdiction Reports | Implemented |
| IFTA Summary | ✅ `/v1/ifta/summary` | ✅ | Implemented |
| Fault Codes | ✅ | ✅ | Implemented |
| Fuel Purchases | ✅ | ❌ | Partial |
| **Webhooks** | ✅ | ✅ 2.0 | **NOT IMPLEMENTED** |
| **Real-time Push** | ❌ Polling only | ❌ Polling only | **NEEDS WEBHOOKS** |

### Key Gaps to Address

1. **No Webhook Integration** - Currently relies on polling every 60 minutes
2. **No Real-time Updates** - Frontend doesn't receive live data
3. **Manual IFTA** - GPS data exists but jurisdiction detection isn't automated
4. **No Mobile App** - Drivers can't view HOS or loads on mobile
5. **Polling Inefficiency** - Wastes API calls for unchanged data

---

## 2. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ELD PROVIDERS                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │   MOTIVE    │  │   SAMSARA   │  │   FUTURE    │                          │
│  │  (Webhooks) │  │ (Webhooks)  │  │  PROVIDERS  │                          │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                          │
└─────────┼────────────────┼──────────────────────────────────────────────────┘
          │                │
          │  HTTPS POST    │  HTTPS POST
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRUCK COMMAND BACKEND                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    WEBHOOK INGESTION LAYER                              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │ │
│  │  │ /api/webhooks/  │  │ /api/webhooks/  │  │   Signature Validator   │ │ │
│  │  │    motive       │  │    samsara      │  │   Rate Limiter          │ │ │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────────────────────┘ │ │
│  └───────────┼────────────────────┼───────────────────────────────────────┘ │
│              │                    │                                          │
│              ▼                    ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    EVENT PROCESSING LAYER                               │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │ │
│  │  │ GPS Location  │  │  HOS Status   │  │  Fault Code   │               │ │
│  │  │   Handler     │  │   Handler     │  │   Handler     │               │ │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘               │ │
│  │          │                  │                  │                        │ │
│  │          ▼                  ▼                  ▼                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │              JURISDICTION DETECTION ENGINE                       │   │ │
│  │  │   • Reverse geocoding (lat/lng → state)                         │   │ │
│  │  │   • State boundary crossing detection                           │   │ │
│  │  │   • Mileage calculation between points                          │   │ │
│  │  │   • IFTA jurisdiction aggregation                               │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│              │                                                               │
│              ▼                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         SUPABASE DATABASE                               │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │  vehicles   │ │   drivers   │ │ eld_ifta_   │ │ eld_hos_    │      │ │
│  │  │ (location)  │ │ (hos_status)│ │   mileage   │ │    logs     │      │ │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘      │ │
│  │         │               │               │               │              │ │
│  │         └───────────────┴───────────────┴───────────────┘              │ │
│  │                                   │                                     │ │
│  │                    SUPABASE REALTIME (Postgres Changes)                 │ │
│  └───────────────────────────────────┼────────────────────────────────────┘ │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       │ WebSocket
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND CLIENTS                                │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │     WEB APP (Next.js)       │  │      MOBILE APP (React Native)      │  │
│  │  ┌───────────────────────┐  │  │  ┌─────────────────────────────┐   │  │
│  │  │   Fleet Map (Live)    │  │  │  │   Driver HOS Dashboard      │   │  │
│  │  │   HOS Dashboard       │  │  │  │   Load Information          │   │  │
│  │  │   IFTA Reports        │  │  │  │   Navigation Integration    │   │  │
│  │  │   Dispatch Board      │  │  │  │   Document Upload           │   │  │
│  │  └───────────────────────┘  │  │  │   Offline Mode              │   │  │
│  └─────────────────────────────┘  │  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **ELD Device** → Records GPS, engine data, HOS events
2. **ELD Provider** → Sends webhook to Truck Command API
3. **Webhook Handler** → Validates signature, processes event
4. **Jurisdiction Engine** → Detects state crossings, calculates miles
5. **Database** → Stores data with Realtime triggers
6. **Supabase Realtime** → Broadcasts changes to subscribers
7. **Web/Mobile App** → Updates UI in real-time

---

## 3. Webhook Integration

### Why Webhooks Over Polling

| Aspect | Polling (Current) | Webhooks (Proposed) |
|--------|-------------------|---------------------|
| **Data Freshness** | Up to 60 min old | Real-time (seconds) |
| **API Calls** | 24 calls/day per fleet | Only when events occur |
| **Rate Limits** | Risk of hitting limits | Minimal API usage |
| **Cost** | Higher API costs | Lower costs |
| **Battery (Mobile)** | Constant background fetch | Push notifications |

### Webhook Event Types to Subscribe

#### Motive Webhooks
```javascript
const MOTIVE_WEBHOOK_EVENTS = [
  'vehicle_location_updated',   // GPS breadcrumbs
  'driver_duty_status_changed', // HOS changes
  'fault_code_detected',        // Vehicle diagnostics
  'fault_code_cleared',
  'driver_availability_changed',// Drive time updates
  'vehicle_assigned',           // Driver-vehicle assignments
  'eld_malfunction',            // Compliance alerts
];
```

#### Samsara Webhooks 2.0
```javascript
const SAMSARA_WEBHOOK_EVENTS = [
  'VehicleStatsUpdated',        // GPS + engine data
  'DriverDutyStatusChanged',    // HOS changes
  'VehicleDtcUpdated',          // Fault codes
  'HosViolation',               // HOS violations
  'HosClockWarning',            // Low drive time warnings
  'GeofenceEntry',              // For IFTA state tracking
  'GeofenceExit',
];
```

### Webhook API Endpoints

```
POST /api/webhooks/motive
POST /api/webhooks/samsara
```

### Webhook Handler Architecture

```javascript
// /api/webhooks/[provider]/route.js

export async function POST(request, { params }) {
  const { provider } = params;

  // 1. Validate webhook signature
  const isValid = await validateWebhookSignature(request, provider);
  if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 401 });

  // 2. Parse webhook payload
  const payload = await request.json();

  // 3. Identify tenant (user_id) from connection
  const connection = await findConnectionByExternalId(payload.companyId, provider);
  if (!connection) return Response.json({ error: 'Unknown company' }, { status: 404 });

  // 4. Route to appropriate handler
  const handler = getEventHandler(provider, payload.eventType);
  await handler.process(connection.user_id, payload);

  // 5. Respond quickly (process async if needed)
  return Response.json({ received: true });
}
```

### Webhook Security

```javascript
// Motive signature validation
function validateMotiveSignature(request, body) {
  const signature = request.headers.get('X-Motive-Signature');
  const timestamp = request.headers.get('X-Motive-Timestamp');
  const secret = process.env.MOTIVE_WEBHOOK_SECRET;

  const payload = `${timestamp}.${JSON.stringify(body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Samsara signature validation
function validateSamsaraSignature(request, body) {
  const signature = request.headers.get('X-Samsara-Hmac-Sha256');
  const secret = process.env.SAMSARA_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## 4. Automated IFTA Mileage System

### The Core Problem

IFTA (International Fuel Tax Agreement) requires tracking miles driven in each US state and Canadian province. Currently, your app supports:
- Manual entry via state crossing tracker
- Load-based import
- ELD import (batch, not real-time)

### The Solution: Real-Time Jurisdiction Detection

```
GPS Breadcrumb → Reverse Geocode → Detect Crossing → Calculate Miles → Update IFTA
```

### Jurisdiction Detection Algorithm

```javascript
// src/lib/services/eld/iftaJurisdictionService.js

class IFTAJurisdictionService {

  /**
   * Process a GPS location update and detect jurisdiction changes
   */
  async processLocationUpdate(userId, vehicleId, location) {
    // 1. Get current jurisdiction from coordinates
    const jurisdiction = await this.getJurisdiction(location.latitude, location.longitude);

    // 2. Get previous location for this vehicle
    const prevLocation = await this.getLastLocation(vehicleId);

    // 3. If jurisdiction changed, record crossing
    if (prevLocation && prevLocation.jurisdiction !== jurisdiction) {
      await this.recordJurisdictionCrossing({
        userId,
        vehicleId,
        fromJurisdiction: prevLocation.jurisdiction,
        toJurisdiction: jurisdiction,
        crossingPoint: location,
        timestamp: location.recordedAt,
        odometerAtCrossing: location.odometerMiles
      });
    }

    // 4. Calculate incremental mileage
    if (prevLocation) {
      const miles = this.calculateDistance(prevLocation, location);
      await this.addJurisdictionMiles(userId, vehicleId, jurisdiction, miles);
    }

    // 5. Update last known location with jurisdiction
    await this.updateLastLocation(vehicleId, { ...location, jurisdiction });
  }

  /**
   * Get jurisdiction (state/province) from coordinates
   * Uses reverse geocoding with caching
   */
  async getJurisdiction(lat, lng) {
    // Check cache first (jurisdictions don't change often)
    const cacheKey = `${Math.round(lat * 100)}_${Math.round(lng * 100)}`;
    const cached = this.jurisdictionCache.get(cacheKey);
    if (cached) return cached;

    // Option 1: Use point-in-polygon with state boundaries (fast, offline)
    const jurisdiction = this.pointInPolygonLookup(lat, lng);

    // Option 2: Fallback to reverse geocoding API
    // const jurisdiction = await this.reverseGeocode(lat, lng);

    this.jurisdictionCache.set(cacheKey, jurisdiction);
    return jurisdiction;
  }

  /**
   * Point-in-polygon lookup using pre-loaded state boundaries
   * Much faster than API calls - O(log n) with spatial indexing
   */
  pointInPolygonLookup(lat, lng) {
    // Uses turf.js or similar for geo operations
    // State/province boundaries loaded from GeoJSON
    const point = turf.point([lng, lat]);

    for (const [code, polygon] of this.stateBoundaries) {
      if (turf.booleanPointInPolygon(point, polygon)) {
        return code; // e.g., 'TX', 'OK', 'ON'
      }
    }
    return null;
  }

  /**
   * Calculate distance between two points in miles
   */
  calculateDistance(point1, point2) {
    // If odometer readings available, use those (most accurate)
    if (point1.odometerMiles && point2.odometerMiles) {
      return point2.odometerMiles - point1.odometerMiles;
    }

    // Otherwise, calculate geodesic distance
    const from = turf.point([point1.longitude, point1.latitude]);
    const to = turf.point([point2.longitude, point2.latitude]);
    return turf.distance(from, to, { units: 'miles' });
  }
}
```

### Jurisdiction Boundaries Data

```javascript
// Load US state and Canadian province boundaries
// Source: US Census Bureau TIGER/Line files, Statistics Canada

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const CA_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
];
```

### IFTA Mileage Aggregation

```javascript
/**
 * Aggregate real-time miles into IFTA reporting periods
 */
async function aggregateIFTAMileage(userId, vehicleId, jurisdiction, miles) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = `${year}-Q${Math.ceil(month / 3)}`;

  // Upsert into eld_ifta_mileage
  await supabase
    .from('eld_ifta_mileage')
    .upsert({
      user_id: userId,
      vehicle_id: vehicleId,
      jurisdiction: jurisdiction,
      jurisdiction_name: JURISDICTION_NAMES[jurisdiction],
      year: year,
      month: month,
      quarter: quarter,
      total_miles: miles,
      source: 'eld_realtime'
    }, {
      onConflict: 'vehicle_id,jurisdiction,year,month',
      // Increment existing miles rather than replace
      count: 'exact'
    });

  // Use RPC for atomic increment
  await supabase.rpc('increment_ifta_miles', {
    p_user_id: userId,
    p_vehicle_id: vehicleId,
    p_jurisdiction: jurisdiction,
    p_miles: miles,
    p_year: year,
    p_month: month
  });
}
```

### Database Function for Atomic Increments

```sql
-- Supabase migration: add_ifta_increment_function

CREATE OR REPLACE FUNCTION increment_ifta_miles(
  p_user_id UUID,
  p_vehicle_id UUID,
  p_jurisdiction VARCHAR(5),
  p_miles DECIMAL(12,2),
  p_year INTEGER,
  p_month INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO eld_ifta_mileage (
    user_id, vehicle_id, jurisdiction, year, month, quarter, total_miles, source
  ) VALUES (
    p_user_id,
    p_vehicle_id,
    p_jurisdiction,
    p_year,
    p_month,
    CONCAT(p_year, '-Q', CEIL(p_month / 3.0)::INTEGER),
    p_miles,
    'eld_realtime'
  )
  ON CONFLICT (vehicle_id, jurisdiction, year, month)
  DO UPDATE SET
    total_miles = eld_ifta_mileage.total_miles + p_miles,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Real-Time HOS Tracking

### HOS Data Flow

```
ELD Device → Provider Webhook → Truck Command → Supabase → Realtime → UI
    │                              │
    │  duty_status_changed         │  Update drivers table
    │  availability_changed        │  Update eld_hos_logs
    │                              │  Broadcast via Realtime
    ▼                              ▼
Driver changes    →    Fleet manager sees
from DRIVING           live HOS status
to ON_DUTY             on dashboard
```

### HOS Status Display Component

```jsx
// src/components/eld/HOSStatusCard.jsx

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const HOS_STATUS_COLORS = {
  driving: 'bg-green-500',
  on_duty: 'bg-yellow-500',
  off_duty: 'bg-gray-500',
  sleeper: 'bg-blue-500'
};

export function HOSStatusCard({ driverId }) {
  const [hosData, setHosData] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchHOSStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`hos:${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driverId}`
        },
        (payload) => {
          setHosData({
            status: payload.new.hos_status,
            availableDrive: payload.new.hos_available_drive_minutes,
            availableShift: payload.new.hos_available_shift_minutes,
            availableCycle: payload.new.hos_available_cycle_minutes,
            lastUpdated: payload.new.hos_last_updated_at
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  if (!hosData) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">HOS Status</h3>
        <span className={`px-2 py-1 rounded text-white ${HOS_STATUS_COLORS[hosData.status]}`}>
          {hosData.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        <HOSProgressBar
          label="Drive Time"
          available={hosData.availableDrive}
          max={660} // 11 hours
          warning={120} // 2 hours
          critical={60} // 1 hour
        />
        <HOSProgressBar
          label="Shift Time"
          available={hosData.availableShift}
          max={840} // 14 hours
          warning={120}
          critical={60}
        />
        <HOSProgressBar
          label="Weekly Cycle"
          available={hosData.availableCycle}
          max={4200} // 70 hours
          warning={480} // 8 hours
          critical={240} // 4 hours
        />
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Last updated: {formatRelativeTime(hosData.lastUpdated)}
      </p>
    </div>
  );
}
```

### HOS Violation Alerts

```javascript
// src/lib/services/eld/hosViolationService.js

const HOS_LIMITS = {
  dailyDriving: 660,    // 11 hours in minutes
  dailyOnDuty: 840,     // 14 hours
  weeklyCycle: 4200,    // 70 hours (8-day cycle)
  breakRequired: 480,   // 8 hours driving before 30-min break
  restartRequired: 2040 // 34 hours off for cycle restart
};

async function checkHOSViolations(userId, driverId, hosData) {
  const violations = [];

  // Check 11-hour driving limit
  if (hosData.availableDrive <= 0) {
    violations.push({
      type: 'DAILY_DRIVING_EXCEEDED',
      severity: 'critical',
      message: 'Driver has exceeded 11-hour daily driving limit'
    });
  } else if (hosData.availableDrive <= 60) {
    violations.push({
      type: 'DAILY_DRIVING_WARNING',
      severity: 'warning',
      message: `Only ${hosData.availableDrive} minutes of drive time remaining`
    });
  }

  // Check 14-hour shift limit
  if (hosData.availableShift <= 0) {
    violations.push({
      type: 'DAILY_SHIFT_EXCEEDED',
      severity: 'critical',
      message: 'Driver has exceeded 14-hour daily on-duty limit'
    });
  }

  // Check 70-hour weekly limit
  if (hosData.availableCycle <= 0) {
    violations.push({
      type: 'WEEKLY_CYCLE_EXCEEDED',
      severity: 'critical',
      message: 'Driver has exceeded 70-hour weekly limit'
    });
  }

  // Create notifications for violations
  for (const violation of violations) {
    await createNotification({
      user_id: userId,
      entity_type: 'driver',
      entity_id: driverId,
      type: violation.type,
      title: 'HOS Violation',
      message: violation.message,
      urgency: violation.severity === 'critical' ? 'CRITICAL' : 'HIGH'
    });
  }

  return violations;
}
```

---

## 6. Live Fleet Tracking Map

### Real-Time Map Component

```jsx
// src/components/eld/FleetMap.jsx

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import mapboxgl from 'mapbox-gl';

export function FleetMap({ userId }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const [vehicles, setVehicles] = useState([]);

  // Initialize map
  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4
    });

    return () => map.current?.remove();
  }, []);

  // Subscribe to vehicle location updates
  useEffect(() => {
    // Initial fetch of all vehicle locations
    fetchVehicleLocations();

    // Real-time subscription
    const channel = supabase
      .channel('fleet-locations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicles',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          updateVehicleMarker(payload.new);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  function updateVehicleMarker(vehicle) {
    const location = vehicle.last_known_location;
    if (!location) return;

    if (markers.current[vehicle.id]) {
      // Update existing marker
      markers.current[vehicle.id]
        .setLngLat([location.longitude, location.latitude]);
    } else {
      // Create new marker
      const el = createTruckMarkerElement(vehicle);
      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(createVehiclePopup(vehicle))
        .addTo(map.current);

      markers.current[vehicle.id] = marker;
    }
  }

  function createTruckMarkerElement(vehicle) {
    const el = document.createElement('div');
    el.className = 'truck-marker';
    el.innerHTML = `
      <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
        </svg>
      </div>
    `;
    // Rotate marker based on heading
    if (vehicle.last_known_location?.heading) {
      el.style.transform = `rotate(${vehicle.last_known_location.heading}deg)`;
    }
    return el;
  }

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Vehicle List Sidebar */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 w-72 max-h-[500px] overflow-y-auto">
        <h3 className="font-semibold mb-3">Fleet Vehicles</h3>
        {vehicles.map(vehicle => (
          <VehicleListItem
            key={vehicle.id}
            vehicle={vehicle}
            onClick={() => flyToVehicle(vehicle)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Map Provider Options

| Provider | Cost | Features | Recommendation |
|----------|------|----------|----------------|
| **Mapbox** | $0.50/1000 loads | Vector tiles, custom styles | Best for web |
| **Google Maps** | $7/1000 loads | Street View, traffic | Most features |
| **MapLibre** | Free (OSM) | Open source, self-hosted | Budget option |
| **HERE Maps** | $0.50/1000 | Truck routing, restrictions | Best for trucking |

**Recommendation**: Start with Mapbox for quality/cost balance, consider HERE Maps for truck-specific routing features.

---

## 7. Mobile Driver App

### Why a Mobile App?

1. **Driver Self-Service** - View HOS, loads, and documents without calling dispatch
2. **Offline Capability** - Works in areas with poor cell coverage
3. **Push Notifications** - HOS warnings, load updates, compliance alerts
4. **Document Capture** - BOL, receipts, accident photos
5. **Navigation Integration** - Truck-safe routing to delivery locations

### Technology Recommendation: React Native

| Factor | React Native | Flutter | Native |
|--------|--------------|---------|--------|
| **Team Skills** | ✅ Already use React/Next.js | ❌ New language (Dart) | ❌ Two codebases |
| **Code Sharing** | ✅ Share types, utils, API clients | ❌ None | ❌ None |
| **Development Speed** | Fast (familiar ecosystem) | Fast (hot reload) | Slow |
| **Native Features** | Good (Expo) | Excellent | Perfect |
| **Cost** | $18-30K | $18-30K | $40-60K |
| **Maintenance** | One codebase | One codebase | Two codebases |

**Recommendation**: **React Native with Expo** for maximum code reuse with your Next.js web app.

### Mobile App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP (EXPO)                       │
├─────────────────────────────────────────────────────────────────┤
│  SCREENS                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │    Login     │ │  Dashboard   │ │   HOS View   │             │
│  │              │ │  (Home)      │ │              │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │    Loads     │ │  Documents   │ │   Profile    │             │
│  │   (Active)   │ │  & Camera    │ │  & Settings  │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  SHARED SERVICES (from web app)                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  @truck-command/shared                                      │ │
│  │  • API client (Supabase)                                    │ │
│  │  • TypeScript types                                         │ │
│  │  • Utility functions                                        │ │
│  │  • Validation schemas (Zod)                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  NATIVE FEATURES                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │ Background  │ │    Push     │ │   Camera    │ │  Offline   ││
│  │   Location  │ │   Notifs    │ │  & Scanner  │ │   SQLite   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  OFFLINE-FIRST DATA LAYER                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  WatermelonDB / SQLite                                      │ │
│  │  • Local-first storage                                      │ │
│  │  • Sync with Supabase when online                           │ │
│  │  • Conflict resolution                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile App Features

#### Phase 1: Core Driver Features
- **Authentication** - Login with existing Truck Command credentials
- **HOS Dashboard** - View current status, remaining time, clocks
- **Active Loads** - See assigned loads, pickup/delivery details
- **Navigation** - Deep link to Google Maps/Waze with truck routing
- **Push Notifications** - HOS warnings, load assignments, alerts

#### Phase 2: Document & Communication
- **Document Upload** - Photo capture for BOL, POD, receipts
- **Fuel Entry** - Quick fuel purchase logging
- **Messages** - In-app messaging with dispatch
- **Inspection Forms** - Pre-trip/post-trip DVIRs

#### Phase 3: Advanced Features
- **Offline Mode** - Full functionality without internet
- **Background Tracking** - Optional GPS for non-ELD vehicles
- **Voice Commands** - Hands-free status updates
- **ELD Integration** - Connect directly to ELD device via Bluetooth

### Mobile App Screen Mockups

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ ≡  Driver Dashboard │  │ ≡  HOS Status       │  │ ≡  Active Load      │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│                     │  │                     │  │                     │
│  Welcome, John!     │  │  Current: DRIVING   │  │  Load #TC-2024-0156 │
│                     │  │  ●━━━━━━━━━━━━━━━━● │  │                     │
│  ┌───────────────┐  │  │                     │  │  ┌───────────────┐  │
│  │  HOS STATUS   │  │  │  Drive Time Left    │  │  │ PICKUP        │  │
│  │  DRIVING      │  │  │  ████████░░ 8h 32m  │  │  │ ABC Warehouse │  │
│  │  8h 32m left  │  │  │                     │  │  │ Dallas, TX    │  │
│  └───────────────┘  │  │  Shift Time Left    │  │  │ Jan 15, 8:00a │  │
│                     │  │  ██████░░░░ 10h 15m │  │  └───────────────┘  │
│  ┌───────────────┐  │  │                     │  │          ↓         │
│  │ ACTIVE LOAD   │  │  │  Weekly Cycle       │  │  ┌───────────────┐  │
│  │ #TC-2024-0156 │  │  │  ████████████ 45h   │  │  │ DELIVERY      │  │
│  │ Dallas → OKC  │  │  │                     │  │  │ XYZ Receiver  │  │
│  │ Pickup: Today │  │  │  ┌───────────────┐  │  │  │ Oklahoma City │  │
│  └───────────────┘  │  │  │ 30-min Break  │  │  │  │ Jan 15, 4:00p │  │
│                     │  │  │ Due in 2h 15m │  │  │  └───────────────┘  │
│  [📍 Navigate]      │  │  └───────────────┘  │  │                     │
│  [📄 Documents]     │  │                     │  │  [📍 Navigate]      │
│  [⛽ Log Fuel]      │  │  Last Updated: Now  │  │  [📸 Upload BOL]    │
│                     │  │                     │  │  [✓ Mark Complete]  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Shared Package Structure

```
truck-command/
├── apps/
│   ├── web/                 # Next.js web app (existing)
│   └── mobile/              # React Native app (new)
│       ├── app/
│       │   ├── (auth)/
│       │   │   └── login.tsx
│       │   ├── (tabs)/
│       │   │   ├── index.tsx      # Dashboard
│       │   │   ├── hos.tsx        # HOS status
│       │   │   ├── loads.tsx      # Active loads
│       │   │   ├── documents.tsx  # Document upload
│       │   │   └── profile.tsx    # Settings
│       │   └── _layout.tsx
│       ├── components/
│       ├── hooks/
│       └── package.json
│
└── packages/
    └── shared/              # Shared code (new)
        ├── src/
        │   ├── types/       # TypeScript types
        │   ├── api/         # Supabase client
        │   ├── utils/       # Utility functions
        │   └── validation/  # Zod schemas
        └── package.json
```

---

## 8. Big Fleet Scalability

### Challenges with 100+ Trucks

1. **Data Volume** - 100 trucks × 1 GPS update/minute = 144,000 records/day
2. **Webhook Load** - Burst of events during shift changes
3. **Real-time Subscriptions** - Memory and connection limits
4. **IFTA Processing** - Millions of GPS points to process
5. **API Rate Limits** - Both Motive and Samsara have limits

### Scalability Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        WEBHOOK INGESTION                            │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    VERCEL EDGE FUNCTIONS                    │   │
│  │  • Sub-millisecond cold starts                              │   │
│  │  • Auto-scaling to handle bursts                            │   │
│  │  • Global deployment for low latency                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    MESSAGE QUEUE (Optional)                 │   │
│  │  • Upstash Redis for reliable delivery                      │   │
│  │  • Buffer high-volume webhook events                        │   │
│  │  • Retry failed processing                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                        DATA PROCESSING                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  GPS Processor  │  │  HOS Processor  │  │ IFTA Processor  │    │
│  │                 │  │                 │  │                 │    │
│  │ • Batch inserts │  │ • Status update │  │ • Jurisdiction  │    │
│  │ • Location cache│  │ • Violation chk │  │   detection     │    │
│  │ • Deduplication │  │ • Notifications │  │ • Mile calc     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  PARTITIONED TABLES (for scale)                             │   │
│  │  • eld_vehicle_locations_YYYY_MM (monthly partitions)       │   │
│  │  • eld_hos_logs_YYYY_MM                                     │   │
│  │  • Automatic partition pruning for queries                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  MATERIALIZED VIEWS (for performance)                       │   │
│  │  • fleet_status_summary (refresh every 5 min)               │   │
│  │  • ifta_quarterly_summary (refresh hourly)                  │   │
│  │  • hos_violations_today                                     │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  INDEXES                                                    │   │
│  │  • (user_id, recorded_at DESC) on locations                 │   │
│  │  • (vehicle_id, recorded_at DESC) on locations              │   │
│  │  • (driver_id, log_date) on hos_logs                        │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Database Partitioning Strategy

```sql
-- Partition eld_vehicle_locations by month
CREATE TABLE eld_vehicle_locations (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    -- ... other columns
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create partitions automatically
CREATE TABLE eld_vehicle_locations_2024_01
    PARTITION OF eld_vehicle_locations
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE eld_vehicle_locations_2024_02
    PARTITION OF eld_vehicle_locations
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Function to auto-create partitions
CREATE OR REPLACE FUNCTION create_location_partition()
RETURNS TRIGGER AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_name := 'eld_vehicle_locations_' || to_char(NEW.recorded_at, 'YYYY_MM');
    start_date := date_trunc('month', NEW.recorded_at);
    end_date := start_date + INTERVAL '1 month';

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = partition_name) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF eld_vehicle_locations FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Caching Strategy

```javascript
// src/lib/services/eld/eldCacheService.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const CACHE_TTL = {
  VEHICLE_LOCATION: 60,      // 1 minute
  DRIVER_HOS: 300,           // 5 minutes
  FLEET_SUMMARY: 300,        // 5 minutes
  JURISDICTION_LOOKUP: 86400 // 24 hours
};

export const eldCache = {
  // Cache vehicle locations
  async setVehicleLocation(vehicleId, location) {
    const key = `vehicle:${vehicleId}:location`;
    await redis.setex(key, CACHE_TTL.VEHICLE_LOCATION, JSON.stringify(location));
  },

  async getVehicleLocation(vehicleId) {
    const key = `vehicle:${vehicleId}:location`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  },

  // Cache fleet summary for dashboard
  async setFleetSummary(userId, summary) {
    const key = `fleet:${userId}:summary`;
    await redis.setex(key, CACHE_TTL.FLEET_SUMMARY, JSON.stringify(summary));
  },

  // Cache jurisdiction lookups
  async setJurisdiction(lat, lng, jurisdiction) {
    const key = `geo:${Math.round(lat * 100)}_${Math.round(lng * 100)}`;
    await redis.setex(key, CACHE_TTL.JURISDICTION_LOOKUP, jurisdiction);
  },

  async getJurisdiction(lat, lng) {
    const key = `geo:${Math.round(lat * 100)}_${Math.round(lng * 100)}`;
    return await redis.get(key);
  }
};
```

### Rate Limiting for ELD APIs

```javascript
// src/lib/services/eld/rateLimiter.js

const RATE_LIMITS = {
  motive: {
    requestsPerMinute: 60,
    requestsPerDay: 10000
  },
  samsara: {
    requestsPerMinute: 100,
    requestsPerDay: 50000
  }
};

class RateLimiter {
  constructor(provider) {
    this.provider = provider;
    this.limits = RATE_LIMITS[provider];
  }

  async checkLimit(userId) {
    const minuteKey = `rate:${this.provider}:${userId}:minute`;
    const dayKey = `rate:${this.provider}:${userId}:day`;

    const [minuteCount, dayCount] = await Promise.all([
      redis.incr(minuteKey),
      redis.incr(dayKey)
    ]);

    // Set expiry on first request
    if (minuteCount === 1) await redis.expire(minuteKey, 60);
    if (dayCount === 1) await redis.expire(dayKey, 86400);

    if (minuteCount > this.limits.requestsPerMinute) {
      throw new Error(`Rate limit exceeded: ${this.limits.requestsPerMinute}/minute`);
    }

    if (dayCount > this.limits.requestsPerDay) {
      throw new Error(`Daily rate limit exceeded: ${this.limits.requestsPerDay}/day`);
    }

    return true;
  }
}
```

---

## 9. Database Schema Additions

### New Tables Required

```sql
-- 1. Webhook Events Log (for debugging and replay)
CREATE TABLE eld_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_user_provider ON eld_webhook_events(user_id, provider);
CREATE INDEX idx_webhook_events_processed ON eld_webhook_events(processed) WHERE processed = FALSE;

-- 2. Jurisdiction Crossings (detailed state boundary events)
CREATE TABLE eld_jurisdiction_crossings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    from_jurisdiction VARCHAR(5),
    to_jurisdiction VARCHAR(5) NOT NULL,
    crossing_latitude DECIMAL(10,7) NOT NULL,
    crossing_longitude DECIMAL(10,7) NOT NULL,
    odometer_at_crossing DECIMAL(12,1),
    crossed_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(20) DEFAULT 'eld_webhook', -- eld_webhook, eld_sync, manual
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jurisdiction_crossings_vehicle ON eld_jurisdiction_crossings(vehicle_id, crossed_at DESC);
CREATE INDEX idx_jurisdiction_crossings_user_date ON eld_jurisdiction_crossings(user_id, crossed_at DESC);

-- 3. HOS Violations Log
CREATE TABLE eld_hos_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    violation_type VARCHAR(50) NOT NULL,
    -- Types: DAILY_DRIVING_EXCEEDED, DAILY_SHIFT_EXCEEDED, WEEKLY_CYCLE_EXCEEDED,
    --        BREAK_REQUIRED, FORM_MANNER_VIOLATION, etc.
    severity VARCHAR(20) NOT NULL, -- warning, violation, critical
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    source VARCHAR(50), -- eld_webhook, calculated
    external_violation_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hos_violations_driver ON eld_hos_violations(driver_id, occurred_at DESC);
CREATE INDEX idx_hos_violations_unresolved ON eld_hos_violations(user_id, resolved_at) WHERE resolved_at IS NULL;

-- 4. Webhook Subscriptions (track what we're subscribed to)
CREATE TABLE eld_webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES eld_connections(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    external_subscription_id VARCHAR(255),
    webhook_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, paused, failed
    last_received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id, event_type)
);

-- 5. Driver Sessions (for mobile app)
CREATE TABLE driver_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    device_id VARCHAR(255),
    device_type VARCHAR(50), -- ios, android
    push_token TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_driver_sessions_driver ON driver_sessions(driver_id);
CREATE INDEX idx_driver_sessions_active ON driver_sessions(last_active_at DESC);
```

### Update Existing Tables

```sql
-- Add webhook secret storage to eld_connections
ALTER TABLE eld_connections
ADD COLUMN webhook_secret TEXT,
ADD COLUMN webhook_url TEXT,
ADD COLUMN webhook_enabled BOOLEAN DEFAULT FALSE;

-- Add last jurisdiction to vehicles for quick lookup
ALTER TABLE vehicles
ADD COLUMN last_jurisdiction VARCHAR(5),
ADD COLUMN last_jurisdiction_at TIMESTAMPTZ;

-- Add mobile app fields to drivers
ALTER TABLE drivers
ADD COLUMN mobile_app_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN mobile_pin_hash VARCHAR(255),
ADD COLUMN mobile_last_login_at TIMESTAMPTZ;
```

---

## 10. API Endpoints

### Webhook Endpoints

```
POST /api/webhooks/motive
POST /api/webhooks/samsara
```

### ELD Management Endpoints

```
# Connections
GET    /api/eld/connections              # List all ELD connections
POST   /api/eld/connections/[provider]   # Initiate OAuth flow
DELETE /api/eld/connections/[id]         # Disconnect ELD
POST   /api/eld/connections/[id]/sync    # Trigger manual sync

# Webhooks
GET    /api/eld/webhooks                 # List webhook subscriptions
POST   /api/eld/webhooks/[provider]      # Register webhook with provider
DELETE /api/eld/webhooks/[id]            # Unsubscribe from webhook

# Vehicles & Locations
GET    /api/eld/vehicles                 # Get all vehicles with locations
GET    /api/eld/vehicles/[id]/location   # Get vehicle location history
GET    /api/eld/vehicles/[id]/trips      # Get vehicle trip history

# Drivers & HOS
GET    /api/eld/drivers                  # Get all drivers with HOS status
GET    /api/eld/drivers/[id]/hos         # Get driver HOS details
GET    /api/eld/drivers/[id]/logs        # Get driver duty logs

# IFTA
GET    /api/eld/ifta/summary             # Get IFTA summary by quarter
GET    /api/eld/ifta/jurisdictions       # Get mileage by jurisdiction
GET    /api/eld/ifta/crossings           # Get jurisdiction crossing events
POST   /api/eld/ifta/recalculate         # Recalculate from GPS history
```

### Mobile App Endpoints

```
# Authentication
POST   /api/mobile/auth/login            # Driver login (email/PIN)
POST   /api/mobile/auth/logout           # Driver logout
POST   /api/mobile/auth/register-device  # Register push token

# Driver Data
GET    /api/mobile/driver/profile        # Get driver profile
GET    /api/mobile/driver/hos            # Get current HOS status
GET    /api/mobile/driver/loads          # Get assigned loads

# Actions
POST   /api/mobile/loads/[id]/status     # Update load status
POST   /api/mobile/documents             # Upload document
POST   /api/mobile/fuel                  # Log fuel purchase
```

---

## 11. User Flows

### Flow 1: Connect ELD Provider

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ELD PROVIDER CONNECTION FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   STEP 1    │     │   STEP 2    │     │   STEP 3    │     │   STEP 4    │
│             │     │             │     │             │     │             │
│  Settings   │ ──▶ │  Select     │ ──▶ │  OAuth      │ ──▶ │  Vehicle    │
│  > ELD      │     │  Provider   │     │  Login      │     │  Mapping    │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ • "Connect  │     │ • Show      │     │ • Redirect  │     │ • Show ELD  │
│   Your ELD" │     │   Motive,   │     │   to        │     │   vehicles  │
│   button    │     │   Samsara   │     │   provider  │     │ • Match to  │
│             │     │   logos     │     │   OAuth     │     │   local     │
│ • Benefits  │     │ • Compare   │     │ • User      │     │   vehicles  │
│   explained │     │   features  │     │   grants    │     │ • Create    │
│             │     │             │     │   access    │     │   new if    │
│             │     │             │     │             │     │   needed    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘

                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────────┐
│   STEP 7    │     │   STEP 6    │     │            STEP 5               │
│             │     │             │     │                                 │
│  Dashboard  │ ◀── │  Initial    │ ◀── │       Driver Mapping            │
│  Live!      │     │  Sync       │     │                                 │
│             │     │             │     └─────────────────────────────────┘
└─────────────┘     └─────────────┘                    │
       │                   │                           ▼
       ▼                   ▼                 ┌─────────────────────┐
┌─────────────┐     ┌─────────────┐         │ • Show ELD drivers  │
│ • Real-time │     │ • Fetch     │         │ • Match to local    │
│   vehicle   │     │   vehicles  │         │   drivers           │
│   locations │     │ • Fetch     │         │ • Create new if     │
│ • HOS       │     │   drivers   │         │   needed            │
│   status    │     │ • Fetch HOS │         │ • Invite drivers    │
│ • IFTA data │     │ • Setup     │         │   to mobile app     │
│             │     │   webhooks  │         └─────────────────────┘
└─────────────┘     └─────────────┘
```

### Flow 2: Real-Time IFTA Tracking

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTOMATED IFTA MILEAGE FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

    TRUCK DRIVING FROM TEXAS TO OKLAHOMA

    ┌──────────────────────────────────────────────────────────────────┐
    │                                                                   │
    │     TEXAS                    │           OKLAHOMA                │
    │                              │                                   │
    │      🚛 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ✖ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ 🚛           │
    │                              │                                   │
    │    GPS: 34.1234, -99.8765    │    GPS: 34.5678, -97.1234        │
    │    Miles: 150.2              │    Miles: 75.8                    │
    │                              │                                   │
    │                         STATE LINE                               │
    └──────────────────────────────────────────────────────────────────┘

    SYSTEM PROCESSING:

    1. ELD sends GPS webhook ──▶ Webhook handler receives
                                          │
                                          ▼
    2. Jurisdiction detection ──▶ Point-in-polygon lookup
       (34.5678, -97.1234)              │
                                        ▼
                                  Result: "OK" (Oklahoma)
                                          │
                                          ▼
    3. Compare to previous ────▶ Previous: "TX" (Texas)
       jurisdiction                       │
                                          ▼
                                  CROSSING DETECTED!
                                          │
                                          ▼
    4. Record crossing event ──▶ INSERT INTO eld_jurisdiction_crossings
                                  (from: TX, to: OK, lat, lng, odometer)
                                          │
                                          ▼
    5. Calculate miles ────────▶ TX miles = crossing_odometer - start_odometer
                                  OK miles = current_odometer - crossing_odometer
                                          │
                                          ▼
    6. Update IFTA totals ─────▶ UPSERT INTO eld_ifta_mileage
                                  TX: +150.2 miles
                                  OK: +75.8 miles
                                          │
                                          ▼
    7. Supabase Realtime ──────▶ Broadcast changes
                                          │
                                          ▼
    8. Dashboard updates ──────▶ IFTA report shows real-time totals
```

### Flow 3: HOS Violation Alert

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       HOS VIOLATION ALERT FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

    DRIVER APPROACHING 11-HOUR LIMIT

    ┌───────────────────────────────────────────────────────────────────┐
    │   Driver: John Smith                                              │
    │   Status: DRIVING                                                 │
    │   Drive Time Used: 10h 30m / 11h 00m                              │
    │                    ████████████████████░░  (95%)                  │
    │                                                                   │
    │   ⚠️  WARNING: Only 30 minutes of drive time remaining!          │
    └───────────────────────────────────────────────────────────────────┘

    SYSTEM FLOW:

    1. ELD webhook ───────────▶ driver_duty_status_changed
       (every status change)           │
                                       ▼
    2. Update HOS in DB ──────▶ drivers.hos_available_drive_minutes = 30
                                       │
                                       ▼
    3. Check thresholds ──────▶ 30 min < 60 min threshold
                                       │
                                       ▼
                                  TRIGGER WARNING!
                                       │
                           ┌───────────┴───────────┐
                           ▼                       ▼
    4a. Create notification          4b. Send push notification
        in database                      to mobile app
              │                               │
              ▼                               ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │ Fleet Manager sees  │         │ Driver phone buzzes │
    │ warning on dashboard│         │ "30 min drive time  │
    │                     │         │  remaining!"        │
    └─────────────────────┘         └─────────────────────┘
                                             │
                                             ▼
    5. Driver acknowledges ─────▶ Driver plans stop for rest
```

### Flow 4: Mobile App Driver Login

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DRIVER MOBILE APP LOGIN FLOW                        │
└─────────────────────────────────────────────────────────────────────────┘

    DRIVER ONBOARDING:

    1. Fleet manager invites driver
       ┌───────────────────────────────────────┐
       │ Invite Driver to Mobile App           │
       │                                       │
       │ Driver: John Smith                    │
       │ Email: john@email.com                 │
       │                                       │
       │ [Send Invitation]                     │
       └───────────────────────────────────────┘
                         │
                         ▼
    2. Driver receives email
       ┌───────────────────────────────────────┐
       │ You've been invited to Truck Command! │
       │                                       │
       │ Download the app:                     │
       │ • iOS: [App Store Link]               │
       │ • Android: [Play Store Link]          │
       │                                       │
       │ Your login code: TC-2024-ABCD         │
       └───────────────────────────────────────┘
                         │
                         ▼
    3. Driver downloads app & logs in
       ┌───────────────────────────────────────┐
       │         Truck Command                  │
       │           🚛                           │
       │                                       │
       │  Enter your login code:               │
       │  ┌─────────────────────────────────┐  │
       │  │ TC-2024-ABCD                    │  │
       │  └─────────────────────────────────┘  │
       │                                       │
       │  Create a 4-digit PIN:                │
       │  ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
       │  │ 1 │ │ 2 │ │ 3 │ │ 4 │            │
       │  └───┘ └───┘ └───┘ └───┘            │
       │                                       │
       │  [Complete Setup]                     │
       └───────────────────────────────────────┘
                         │
                         ▼
    4. Driver sees dashboard
       ┌───────────────────────────────────────┐
       │  Welcome, John!                        │
       │                                       │
       │  ┌─────────────────────────────────┐  │
       │  │ HOS Status: OFF DUTY            │  │
       │  │ Drive Time: 11h 00m available   │  │
       │  └─────────────────────────────────┘  │
       │                                       │
       │  ┌─────────────────────────────────┐  │
       │  │ Active Load: None               │  │
       │  │                                 │  │
       │  └─────────────────────────────────┘  │
       │                                       │
       │  [📍 Navigate] [⛽ Log Fuel]          │
       └───────────────────────────────────────┘
```

### Flow 5: Generate IFTA Report

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      IFTA QUARTERLY REPORT FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

    USER GENERATES Q4 2024 IFTA REPORT:

    1. Navigate to IFTA Reports
       ┌───────────────────────────────────────────────────────────────┐
       │  IFTA Reports                                                  │
       │                                                               │
       │  Quarter: [Q4 2024 ▼]  Vehicle: [All Vehicles ▼]  [Generate]  │
       └───────────────────────────────────────────────────────────────┘
                         │
                         ▼
    2. System aggregates data from multiple sources
       ┌───────────────────────────────────────────────────────────────┐
       │  Data Sources:                                                │
       │  ├─ ELD Real-time (webhooks)     ████████████  85%            │
       │  ├─ ELD Batch Sync               ██████░░░░░░  12%            │
       │  ├─ Manual Entry                 █░░░░░░░░░░░   2%            │
       │  └─ Load Imports                 █░░░░░░░░░░░   1%            │
       └───────────────────────────────────────────────────────────────┘
                         │
                         ▼
    3. Display jurisdiction summary
       ┌───────────────────────────────────────────────────────────────┐
       │  Q4 2024 IFTA Summary                                         │
       │                                                               │
       │  ┌──────────┬─────────────┬─────────────┬─────────────────┐  │
       │  │ State    │ Total Miles │ Taxable     │ Fuel Gallons    │  │
       │  ├──────────┼─────────────┼─────────────┼─────────────────┤  │
       │  │ TX       │   12,456.2  │   12,456.2  │      2,491.2    │  │
       │  │ OK       │    8,234.5  │    8,234.5  │      1,646.9    │  │
       │  │ KS       │    5,678.3  │    5,678.3  │      1,135.7    │  │
       │  │ MO       │    3,456.1  │    3,456.1  │        691.2    │  │
       │  │ AR       │    2,345.8  │    2,345.8  │        469.2    │  │
       │  ├──────────┼─────────────┼─────────────┼─────────────────┤  │
       │  │ TOTAL    │   32,170.9  │   32,170.9  │      6,434.2    │  │
       │  └──────────┴─────────────┴─────────────┴─────────────────┘  │
       │                                                               │
       │  Average MPG: 5.00                                            │
       │                                                               │
       │  [📄 Export PDF]  [📊 Export CSV]  [📤 Submit to State]       │
       └───────────────────────────────────────────────────────────────┘
                         │
                         ▼
    4. Export or submit
       ┌───────────────────────────────────────────────────────────────┐
       │  IFTA Report Generated Successfully!                          │
       │                                                               │
       │  ✅ PDF exported to: IFTA_Q4_2024_Report.pdf                  │
       │  ✅ CSV exported to: IFTA_Q4_2024_Data.csv                    │
       │                                                               │
       │  Next Steps:                                                  │
       │  1. Review the report for accuracy                            │
       │  2. Submit to your base jurisdiction                          │
       │  3. Pay any taxes due by January 31, 2025                     │
       └───────────────────────────────────────────────────────────────┘
```

---

## 12. Implementation Phases

### Phase 1: Webhook Foundation (2-3 weeks)

**Goal**: Receive real-time data from ELD providers

| Task | Effort | Priority |
|------|--------|----------|
| Create webhook API endpoints for Motive/Samsara | 3 days | P0 |
| Implement signature validation | 1 day | P0 |
| Create event handlers for GPS, HOS, faults | 3 days | P0 |
| Store webhook events for debugging | 1 day | P1 |
| Register webhooks with providers via API | 2 days | P0 |
| Test with real ELD data | 2 days | P0 |

**Deliverables**:
- `/api/webhooks/motive` and `/api/webhooks/samsara` endpoints
- Real-time GPS and HOS data flowing into database
- Webhook event logging for debugging

### Phase 2: Real-Time Frontend (2 weeks)

**Goal**: Display live data in the web app

| Task | Effort | Priority |
|------|--------|----------|
| Set up Supabase Realtime subscriptions | 2 days | P0 |
| Build live fleet map component | 4 days | P0 |
| Build real-time HOS dashboard | 3 days | P0 |
| Add HOS violation alerts | 2 days | P1 |
| Optimize for performance (caching, batching) | 2 days | P1 |

**Deliverables**:
- Live fleet tracking map with vehicle positions
- Real-time HOS status for all drivers
- Push notifications for violations

### Phase 3: Automated IFTA (2-3 weeks)

**Goal**: Automatically calculate state-by-state mileage

| Task | Effort | Priority |
|------|--------|----------|
| Load US/Canada jurisdiction boundaries | 2 days | P0 |
| Implement point-in-polygon lookup | 2 days | P0 |
| Build jurisdiction crossing detection | 3 days | P0 |
| Create mileage aggregation system | 2 days | P0 |
| Build database functions for atomic updates | 1 day | P0 |
| Integrate with existing IFTA reports | 2 days | P0 |
| Historical GPS reprocessing tool | 2 days | P2 |

**Deliverables**:
- Automatic jurisdiction detection from GPS
- Real-time IFTA mileage accumulation
- Seamless integration with quarterly reports

### Phase 4: Mobile App MVP (6-8 weeks)

**Goal**: Launch driver companion app

| Task | Effort | Priority |
|------|--------|----------|
| Set up React Native/Expo project | 2 days | P0 |
| Create shared packages structure | 3 days | P0 |
| Build authentication flow | 5 days | P0 |
| Build HOS dashboard screen | 4 days | P0 |
| Build active loads screen | 4 days | P0 |
| Add navigation integration | 2 days | P1 |
| Add document upload (camera) | 3 days | P1 |
| Add push notifications | 3 days | P0 |
| Build offline data layer | 5 days | P1 |
| Testing and bug fixes | 5 days | P0 |
| App Store/Play Store submission | 3 days | P0 |

**Deliverables**:
- iOS and Android apps in stores
- Driver can view HOS, loads, and upload documents
- Push notifications for important alerts

### Phase 5: Scalability & Polish (2-3 weeks)

**Goal**: Optimize for large fleets

| Task | Effort | Priority |
|------|--------|----------|
| Implement table partitioning | 2 days | P1 |
| Add Redis caching layer | 2 days | P1 |
| Create materialized views | 2 days | P1 |
| Implement rate limiting | 1 day | P0 |
| Performance testing with 100+ vehicles | 3 days | P0 |
| Monitoring and alerting setup | 2 days | P1 |

**Deliverables**:
- System handles 100+ trucks efficiently
- Sub-second response times
- Proactive monitoring

---

## 13. Cost Estimates

### Development Costs

| Phase | Internal | Agency ($150/hr) |
|-------|----------|------------------|
| Phase 1: Webhooks | 2-3 weeks | $12,000 - $18,000 |
| Phase 2: Real-Time UI | 2 weeks | $12,000 |
| Phase 3: IFTA Automation | 2-3 weeks | $12,000 - $18,000 |
| Phase 4: Mobile App | 6-8 weeks | $36,000 - $48,000 |
| Phase 5: Scalability | 2-3 weeks | $12,000 - $18,000 |
| **TOTAL** | **14-19 weeks** | **$84,000 - $114,000** |

### Ongoing Infrastructure Costs (Monthly)

| Service | Small Fleet (10 trucks) | Large Fleet (100 trucks) |
|---------|-------------------------|--------------------------|
| Supabase (Pro) | $25 | $25 - $100 |
| Vercel (Pro) | $20 | $20 - $100 |
| Mapbox | $0 (free tier) | $50 - $200 |
| Upstash Redis | $0 (free tier) | $10 - $50 |
| Push Notifications (Expo) | $0 (free tier) | $29 |
| **TOTAL** | **~$45/month** | **~$200-500/month** |

### Third-Party API Costs

| Provider | Pricing | Notes |
|----------|---------|-------|
| Motive API | Free with ELD subscription | No additional API fees |
| Samsara API | Free with ELD subscription | No additional API fees |
| Reverse Geocoding | $5/1000 requests | Can use free OSM Nominatim |

---

## Summary

This plan provides a comprehensive roadmap for integrating Motive and Samsara ELD APIs into Truck Command. The key innovations are:

1. **Webhooks over Polling** - Real-time data instead of hourly syncs
2. **Automated IFTA** - GPS-based jurisdiction detection eliminates manual entry
3. **Mobile Driver App** - Self-service for drivers reduces dispatch workload
4. **Scalable Architecture** - Handles small owner-operators to 100+ truck fleets

The phased approach allows you to deliver value incrementally while building toward the complete vision.

---

## Sources

- [Samsara Webhooks Documentation](https://developers.samsara.com/docs/webhooks)
- [Samsara Event Subscriptions](https://developers.samsara.com/docs/event-subscriptions-webhooks)
- [ELD API Functionality Report - TruckerCloud](https://truckercloud.com/post/a-report-on-eld-api-functionality)
- [React Native Background Geolocation 2026](https://differ.blog/p/top-react-native-background-geolocation-for-apps-2026-0803f9)
- [Fleet Management Software Development Guide 2025](https://www.inexture.com/fleet-management-software-for-logistics-and-delivery-operations/)
- [Transportation App Development Guide 2025](https://trangotech.com/blog/transportation-app-development-guide/)
- [Fleetbase Navigator App (Open Source)](https://github.com/fleetbase/navigator-app)
- [ELD Tracking: The Ultimate Guide](https://macropoint.com/news/tracking-carrier-elds/)
