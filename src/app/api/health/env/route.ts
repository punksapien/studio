import { NextResponse } from 'next/server'
import { getEnvironmentStatus, validateEnvironment } from '@/lib/env-validation'

/**
 * Environment Health Check Endpoint
 *
 * Provides detailed status of environment configuration
 * for debugging and validation purposes.
 */
export async function GET() {
  try {
    const validation = validateEnvironment()
    const status = getEnvironmentStatus()

    return NextResponse.json({
      success: validation.isValid,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      validation: {
        isValid: validation.isValid,
        missingCount: validation.missing.length,
        warningCount: validation.warnings.length,
        errorCount: validation.errors.length,
        missing: validation.missing,
        warnings: validation.warnings,
        errors: validation.errors
      },
      status: status
    }, {
      status: validation.isValid ? 200 : 500
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    })
  }
}
