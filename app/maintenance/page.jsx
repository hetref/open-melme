"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Wrench, ArrowLeft } from 'lucide-react'

export default function MaintenancePage() {
    const router = useRouter()
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        // Check if maintenance is still active
        const checkMaintenance = async () => {
            try {
                const response = await fetch('/api/status')
                const data = await response.json()

                if (!data.isMaintenanceMode) {
                    // Maintenance is over, redirect to home
                    router.push('/')
                }
            } catch (error) {
                console.error('Error checking maintenance status:', error)
            }
        }

        const interval = setInterval(checkMaintenance, 10000) // Check every 10 seconds
        return () => clearInterval(interval)
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 opacity-20 blur-xl rounded-full animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-full">
                                <Wrench className="w-12 h-12 text-white animate-bounce" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
                        We're Under Maintenance
                    </h1>

                    {/* Description */}
                    <p className="text-gray-600 text-center mb-8 text-lg">
                        We're currently performing scheduled maintenance to improve your experience.
                        We'll be back shortly!
                    </p>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                        <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                            What's happening?
                        </h2>
                        <ul className="space-y-2 text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>System upgrades and performance improvements</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>Database optimization for faster response times</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>Security enhancements to protect your data</span>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="text-center space-y-4">
                        <p className="text-gray-600">
                            Need immediate assistance? Contact our support team:
                        </p>
                        <a
                            href="mailto:support@melme.com"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Contact Support
                        </a>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-500">
                            This page will automatically refresh when maintenance is complete
                        </p>
                    </div>
                </div>

                {/* Additional Info Card */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Thank you for your patience and understanding
                    </p>
                </div>
            </div>
        </div>
    )
}
