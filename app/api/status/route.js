import { NextResponse } from 'next/server'
import { getMaintenanceConfig } from '@/lib/maintenance'

/**
 * GET /api/status
 * Returns current system status including maintenance mode and registration availability
 */
export async function GET() {
    try {
        const config = getMaintenanceConfig()

        return NextResponse.json({
            isMaintenanceMode: config.isMaintenanceMode,
            isRegistrationAllowed: config.isRegistrationAllowed,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error fetching status:', error)
        return NextResponse.json(
            { error: 'Failed to fetch status' },
            { status: 500 }
        )
    }
}
