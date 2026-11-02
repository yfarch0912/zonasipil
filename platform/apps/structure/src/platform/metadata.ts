/**
 * ZonaSipil platform metadata — PLATFORM-INTEGRATION-CONTRACT §1.
 *
 * This module is declarative only: it describes the application to the
 * ZonaSipil platform. It grants no access by itself. Until the Phase 7
 * licence service exists, the application runs on the development fixtures
 * in `fixtures/licenses/` (contract §6); entitlement for any protected
 * server-side operation must be decided server-side by the platform,
 * never by this client module.
 */
export type LicenseTier = 'none' | 'demo' | 'full'

export interface ZonaSipilAppMetadata {
  appId: string
  appName: string
  appVersion: string
  productCode: string
  requiredLicense: LicenseTier
  minimumPlatformVersion: string
  supportedFeatures: string[]
}

export const APP_METADATA: ZonaSipilAppMetadata = {
  appId: 'structure',
  appName: 'ZonaSipil Structure',
  appVersion: '1.0.0',
  productCode: 'ZS-STRUCTURE',
  requiredLicense: 'full',
  minimumPlatformVersion: '0.1.0',
  supportedFeatures: [
    'calculators',
    'analysis-2d',
    'design-rc-subset',
    'design-steel-subset',
    'report-export',
    'project-import-export',
  ],
}
