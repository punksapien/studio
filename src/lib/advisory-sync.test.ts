import { describe, expect, it } from 'vitest'
import { deriveAdvisoryStatus, normalizeAdvisoryRecord, parseSyncRequestBody } from './advisory-sync'

describe('advisory sync normalization', () => {
  it('keeps a pending row pending', () => {
    expect(deriveAdvisoryStatus({ Verdict: 'Pending', 'Ops Action': 'Pending' })).toBe('pending')
  })

  it('resolves when verdict is terminal', () => {
    expect(deriveAdvisoryStatus({ Verdict: 'APPROVE', 'Ops Action': 'Pending' })).toBe('resolved')
  })

  it('resolves when ops action is terminal even if verdict is blank', () => {
    expect(deriveAdvisoryStatus({ Verdict: null, 'Ops Action': 'Rejected' })).toBe('resolved')
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
