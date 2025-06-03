import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthLogger, ServiceHealth, HealthStatus } from '@/lib/auth-errors'

export async function GET(request: NextRequest) {
  const logger = AuthLogger.getInstance()
  const startTime = Date.now()
  const correlationId = logger.generateCorrelationId()

  logger.logAuthAttempt('system', 'health-check', correlationId)

  try {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      services: {
        database: await checkDatabaseHealth(),
        supabase: await checkSupabaseHealth()
      },
      metrics: {
        responseTime: 0,
        activeUsers: 0,
        errorRate: 0,
        successRate: 0
      },
      timestamp: new Date().toISOString()
    }

    // Calculate recent metrics
    const recentMetrics = logger.getRecentMetrics()
    const recentErrors = logger.getRecentErrors()

    if (recentMetrics.length > 0) {
      const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      const successfulOps = recentMetrics.filter(m => m.success).length
      const successRate = (successfulOps / recentMetrics.length) * 100
      const errorRate = 100 - successRate

      healthStatus.metrics = {
        responseTime: Math.round(avgResponseTime),
        activeUsers: getActiveUsersCount(recentMetrics),
        errorRate: Math.round(errorRate * 100) / 100,
        successRate: Math.round(successRate * 100) / 100
      }
    }

    // Determine overall health status
    const services = Object.values(healthStatus.services)
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length
    const degradedServices = services.filter(s => s.status === 'degraded').length

    if (unhealthyServices > 0) {
      healthStatus.status = 'unhealthy'
    } else if (degradedServices > 0 || healthStatus.metrics.errorRate > 5) {
      healthStatus.status = 'degraded'
    }

    const duration = Date.now() - startTime
    logger.logPerformanceMetric('health-check', duration, true, correlationId)

    return NextResponse.json(healthStatus)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.logPerformanceMetric('health-check', duration, false, correlationId)

    console.error('[HEALTH-CHECK] Health check failed:', error)

    const errorHealthStatus: HealthStatus = {
      status: 'unhealthy',
      services: {
        database: { status: 'unhealthy', responseTime: 0, errorRate: 100, lastCheck: new Date().toISOString() },
        supabase: { status: 'unhealthy', responseTime: 0, errorRate: 100, lastCheck: new Date().toISOString() }
      },
      metrics: {
        responseTime: duration,
        activeUsers: 0,
        errorRate: 100,
        successRate: 0
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(errorHealthStatus, { status: 500 })
  }
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now()

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        details: { error: error.message }
      }
    }

    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      errorRate: 0,
      lastCheck: new Date().toISOString(),
      details: { recordCount: data?.length || 0 }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'unhealthy',
      responseTime,
      errorRate: 100,
      lastCheck: new Date().toISOString(),
      details: { error: String(error) }
    }
  }
}

async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now()

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test auth service
    const { data, error } = await supabase.auth.getSession()
    const responseTime = Date.now() - startTime

    if (error && !error.message.includes('session_not_found')) {
      return {
        status: 'unhealthy',
        responseTime,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        details: { error: error.message }
      }
    }

    return {
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      errorRate: 0,
      lastCheck: new Date().toISOString(),
      details: { authService: 'operational' }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'unhealthy',
      responseTime,
      errorRate: 100,
      lastCheck: new Date().toISOString(),
      details: { error: String(error) }
    }
  }
}

function getActiveUsersCount(metrics: any[]): number {
  // Simple estimation based on recent auth operations
  const authMetrics = metrics.filter(m =>
    m.operation === 'auth-attempt' ||
    m.operation === 'auth-success'
  )

  // Count unique correlation IDs in last 5 minutes
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  const recentMetrics = authMetrics.filter(m =>
    new Date(m.timestamp).getTime() > fiveMinutesAgo
  )

  return new Set(recentMetrics.map(m => m.correlationId)).size
}
