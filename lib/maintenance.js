/**
 * Maintenance and Registration Control Utilities
 * 
 * Provides utilities to check maintenance status and registration control
 */

export function isMaintenanceMode() {
    return process.env.MAINTAINANCE_STATUS === 'true'
}

export function isRegistrationAllowed() {
    return process.env.ALLOW_REGISTER !== 'false'
}

export function getMaintenanceConfig() {
    return {
        isMaintenanceMode: isMaintenanceMode(),
        isRegistrationAllowed: isRegistrationAllowed()
    }
}
