import { createClient } from '@supabase/supabase-js'

export type AdvisoryPayload = Record<string, unknown>

export interface AdvisorySyncRecordInput {
  sourceId: string
  sheetName: string
  rowNumber?: number | null
  status?: 'pending' | 'resolved'
  data: AdvisoryPayload
}

export interface NormalizedAdvisoryRecord {
  source_id: string
  sheet_name: string
  row_number: number | null
  status: 'pending' | 'resolved'
  advisor: string | null
  token: string | null
  entry_date_text: string | null
  verdict: string | null
  ops_action: string | null
  rejection_reason: string | null
  outcome: string | null
  payload: AdvisoryPayload
  last_synced_at: string
}

const MAX_BATCH_SIZE = 250
const MAX_SOURCE_ID_LENGTH = 200
const MAX_SHEET_NAME_LENGTH = 200

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server environment variables are not configured')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export function isAdvisoryApiAuthorized(request: Request): boolean {
  const expected = process.env.ADVISORY_SYNC_API_KEY
  if (!expected) return false

  const bearer = getBearerToken(request)
  const headerKey = request.headers.get('x-api-key')?.trim() || null
  const supplied = bearer || headerKey
  return Boolean(supplied && supplied === expected)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function textOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

function getField(data: AdvisoryPayload, targetHeader: string): unknown {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const target = normalize(targetHeader)

  for (const [key, value] of Object.entries(data)) {
    if (normalize(key) === target) return value
  }

  return undefined
}

function isPendingValue(value: unknown): boolean {
  const text = textOrNull(value)?.toLowerCase()
  return !text || ['pending', 'in progress', 'in-progress', 'awaiting', 'awaiting review', 'tbd'].includes(text)
}

export function deriveAdvisoryStatus(data: AdvisoryPayload): 'pending' | 'resolved' {
  const verdict = getField(data, 'Verdict')
  const opsAction = getField(data, 'Ops Action')

  // The workbook contains both formula-driven Verdict and human-entered Ops Action.
  // A row is resolved as soon as either has a non-pending terminal value.
  if (!isPendingValue(verdict) || !isPendingValue(opsAction)) return 'resolved'
  return 'pending'
}

export function normalizeAdvisoryRecord(input: AdvisorySyncRecordInput): NormalizedAdvisoryRecord {
  if (!input || typeof input !== 'object') throw new Error('Record must be an object')
  if (typeof input.sourceId !== 'string' || !input.sourceId.trim()) throw new Error('sourceId is required')
  if (input.sourceId.length > MAX_SOURCE_ID_LENGTH) throw new Error('sourceId is too long')
  if (typeof input.sheetName !== 'string' || !input.sheetName.trim()) throw new Error('sheetName is required')
  if (input.sheetName.length > MAX_SHEET_NAME_LENGTH) throw new Error('sheetName is too long')
  if (input.rowNumber !== undefined && input.rowNumber !== null) {
    if (!Number.isInteger(input.rowNumber) || input.rowNumber < 2) throw new Error('rowNumber must be an integer >= 2')
  }
  if (!isPlainObject(input.data)) throw new Error('data must be an object containing the row columns')

  const derivedStatus = deriveAdvisoryStatus(input.data)
  const status = input.status === 'pending' || input.status === 'resolved' ? input.status : derivedStatus

  return {
    source_id: input.sourceId.trim(),
    sheet_name: input.sheetName.trim(),
    row_number: input.rowNumber ?? null,
    status,
    advisor: textOrNull(getField(input.data, 'Advisor')),
    token: textOrNull(getField(input.data, 'Token')),
    entry_date_text: textOrNull(getField(input.data, 'Entry Date')),
    verdict: textOrNull(getField(input.data, 'Verdict')),
    ops_action: textOrNull(getField(input.data, 'Ops Action')),
    rejection_reason: textOrNull(getField(input.data, 'Rejection Reason')),
    outcome: textOrNull(getField(input.data, 'Outcome')),
    payload: input.data,
    last_synced_at: new Date().toISOString(),
  }
}

export function parseSyncRequestBody(body: unknown): NormalizedAdvisoryRecord[] {
  if (!isPlainObject(body) || !Array.isArray(body.records)) {
    throw new Error('Request body must contain a records array')
  }

  if (body.records.length === 0) throw new Error('records cannot be empty')
  if (body.records.length > MAX_BATCH_SIZE) throw new Error(`Maximum batch size is ${MAX_BATCH_SIZE}`)

  return body.records.map((record, index) => {
    try {
      return normalizeAdvisoryRecord(record as AdvisorySyncRecordInput)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid record'
      throw new Error(`records[${index}]: ${message}`)
    }
  })
}

export async function upsertAdvisories(records: NormalizedAdvisoryRecord[]) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('advisories')
    .upsert(records, { onConflict: 'source_id' })
    .select('id, source_id, sheet_name, row_number, status, last_synced_at')

  if (error) throw new Error(`Database upsert failed: ${error.message}`)
  return data || []
}

export interface AdvisoryListFilters {
  status?: 'pending' | 'resolved'
  advisor?: string
  token?: string
  limit: number
  offset: number
}

export async function listAdvisories(filters: AdvisoryListFilters) {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('advisories')
    .select('*', { count: 'exact' })
    .order('last_synced_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.advisor) query = query.ilike('advisor', `%${filters.advisor}%`)
  if (filters.token) query = query.ilike('token', `%${filters.token}%`)

  const { data, count, error } = await query
  if (error) throw new Error(`Database read failed: ${error.message}`)

  return { records: data || [], total: count || 0 }
}
