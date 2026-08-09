import { describe, expect, it } from 'vitest'
import { deriveAdvisoryStatus, normalizeAdvisoryRecord, parseSyncRequestBody } from './advisory-sync'

describe('advisory sync normalization', () => {
  it('keeps a pending row pending even when formula verdict has calculated', () => {
    expect(deriveAdvisoryStatus({ Verdict: 'REJECT', 'Ops Action': 'Pending' })).toBe('pending')
  })

  it('does not resolve from formula verdict alone', () => {
    expect(deriveAdvisoryStatus({ Verdict: 'APPROVE', 'Ops Action': null })).toBe('pending')
  })

  it('waits for a rejection reason after a rejected ops action', () => {
    expect(deriveAdvisoryStatus({ Verdict: null, 'Ops Action': 'Rejected', 'Rejection Reason': null })).toBe('pending_reason')
  })

  it('resolves a rejected row once its reason exists', () => {
    expect(deriveAdvisoryStatus({ 'Ops Action': 'Rejected', 'Rejection Reason': 'Framework' })).toBe('resolved')
  })

  it('extracts normalized dashboard fields while preserving the full payload', () => {
    const data = {
      'Entry Date': '17-06-2026 21:00:44',
      Advisor: 'Multifold growth',
      Token: 'NIGHT_USDT',
      Verdict: 'REJECT',
      'Ops Action': 'Rejected',
      'Rejection Reason': 'Framework',
      Outcome: 'ACTIVE',
      'Entry Range%': 1.51,
    }

    const result = normalizeAdvisoryRecord({
      sourceId: 'row-2',
      sheetName: 'Revised  Unified Quality Check',
      rowNumber: 2,
      data,
    })

    expect(result.status).toBe('resolved')
    expect(result.advisor).toBe('Multifold growth')
    expect(result.payload).toEqual(data)
  })

  it('rejects empty batches', () => {
    expect(() => parseSyncRequestBody({ records: [] })).toThrow('records cannot be empty')
  })
})
