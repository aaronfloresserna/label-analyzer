import { calculateDimensions } from './imageUtils'

describe('calculateDimensions', () => {
  it('returns original dimensions when both sides are under max', () => {
    expect(calculateDimensions(400, 300, 800)).toEqual({ width: 400, height: 300 })
  })

  it('scales down wide image keeping aspect ratio', () => {
    expect(calculateDimensions(1600, 900, 800)).toEqual({ width: 800, height: 450 })
  })

  it('scales down tall image keeping aspect ratio', () => {
    expect(calculateDimensions(600, 1200, 800)).toEqual({ width: 400, height: 800 })
  })

  it('scales down square image', () => {
    expect(calculateDimensions(1000, 1000, 800)).toEqual({ width: 800, height: 800 })
  })
})
