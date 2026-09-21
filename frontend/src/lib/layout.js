/*
  Geometry for the flow topology. Computed in a fixed viewBox and scaled by the
  browser, so the same layout works from a phone to a projector.
*/
export const VIEW_WIDTH = 1000
export const MARGIN = 46

export const LB_Y = 34
export const LB_HEIGHT = 58
export const LB_WIDTH = 300

export const SERVER_TOP = 196
export const SERVER_HEIGHT = 104
const NODE_MAX_WIDTH = 54

export function layoutServers(count) {
  const usable = VIEW_WIDTH - MARGIN * 2
  const gap = count > 1 ? usable / (count - 1) : 0
  const width = Math.min(NODE_MAX_WIDTH, Math.max(16, gap * 0.72 || NODE_MAX_WIDTH))

  return Array.from({ length: count }, (_, index) => ({
    index,
    cx: count > 1 ? MARGIN + index * gap : VIEW_WIDTH / 2,
    width,
  }))
}
