import { NextResponse } from 'next/server'
import { isMaintenanceMode } from '@/lib/maintenance'

/**
 * API Middleware to protect routes during maintenance mode
 */
export function createMaintenanceMiddleware() {
    return async (request) => {
        // Check if maintenance mode is active
        if (isMaintenanceMode()) {
            // Allow status endpoint and auth endpoints during maintenance
            const { pathname } = new URL(request.url)
            const allowedPaths = ['/api/status', '/api/auth']
            const isAllowed = allowedPaths.some(path => pathname.startsWith(path))

            if (!isAllowed) {
                return NextResponse.json(
                    {
                        error: 'Service temporarily unavailable',
                        message: 'The system is currently under maintenance. Please try again later.',
                        maintenanceMode: true
                    },
                    { status: 503 }
                )
            }
        }

        return null // Continue to the actual handler
    }
}

/**
 * Helper to wrap API handlers with maintenance check
 */
export function withMaintenance(handler) {
    return async (request, context) => {
        const maintenanceResponse = await createMaintenanceMiddleware()(request)
        if (maintenanceResponse) {
            return maintenanceResponse
        }
        return handler(request, context)
    }
}
