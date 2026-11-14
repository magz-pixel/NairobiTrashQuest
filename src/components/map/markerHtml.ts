/** HTML for the map's custom markers (cleanup calendar tiles, race hotspot chips, new-report pulse). */
import type { Event } from '../../types/database'
import { eventPinLabel, isHappeningNow } from '../../lib/events'

/** Teal "calendar tile" with the day — clearly not a trash pin. 48px touch target, anchored at the tip. */
export function eventPinElement(e: Event, selected: boolean): HTMLElement {
  const { dow, day } = eventPinLabel(e.event_date)
  const live = isHappeningNow(e)
  const ring = selected ? '0 0 0 4px rgba(251,191,36,.95),' : ''
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'rt-marker rt-event-pin'
  el.setAttribute('aria-label', `Cleanup: ${e.title}`)
  el.innerHTML = `<div style="position:relative;width:48px;height:56px">
      <div style="width:48px;height:48px;border-radius:14px;background:#fff;border:2px solid #0b8c76;
        box-shadow:${ring}0 8px 22px rgba(6,59,50,.35);overflow:hidden;font-family:'Plus Jakarta Sans',system-ui,sans-serif;text-align:center">
        <div style="background:${live ? '#ef8268' : '#0b8c76'};color:#fff;font-size:9px;font-weight:900;letter-spacing:.08em;line-height:16px">${live ? 'LIVE' : dow}</div>
        <div style="color:#063b32;font-size:19px;font-weight:900;line-height:28px">${day}</div>
      </div>
      <div style="position:absolute;left:50%;bottom:0;width:12px;height:12px;margin-left:-6px;transform:rotate(45deg);background:#0b8c76;border-radius:2px"></div>
    </div>`
  return el
}

/** Race hotspot chip with its point value ($ badge when funded). */
export function hotspotChipElement(pointValue: number, funded: boolean, label: string): HTMLElement {
  const bg = funded ? '#ca8a04' : '#f97316'
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'rt-marker'
  el.setAttribute('aria-label', `Race hotspot ${label}, ${pointValue} points`)
  el.innerHTML = `<div style="position:relative;min-width:44px;height:44px;padding:0 12px;background:${bg};color:#fff;border-radius:999px;
    display:flex;align-items:center;justify-content:center;font:800 13px 'Plus Jakarta Sans',system-ui,sans-serif;
    border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3)">${pointValue}${
      funded
        ? `<span style="position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;background:#fff;color:${bg};border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;border:1.5px solid ${bg}">$</span>`
        : ''
    }</div>`
  return el
}

/** Expanding gold ring shown where a report was just submitted. */
export function pulseElement(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'rt-pulse'
  el.innerHTML = '<span></span><span></span><i></i>'
  return el
}
