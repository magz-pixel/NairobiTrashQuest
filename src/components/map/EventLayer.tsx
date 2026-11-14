import { Marker } from 'react-leaflet'
import L from 'leaflet'
import type { Event } from '../../types/database'
import { eventPinLabel, hasPin, isHappeningNow } from '../../lib/events'

/**
 * Upcoming cleanups: a teal "calendar tile" with the day, clearly different from the
 * orange trash clusters and the race-point chips. 48px touch target.
 */
function eventIcon(e: Event, selected: boolean) {
  const { dow, day } = eventPinLabel(e.event_date)
  const live = isHappeningNow(e)
  const ring = selected ? '0 0 0 4px rgba(251,191,36,.9),' : ''
  return L.divIcon({
    className: 'event-pin map-pin',
    html: `<div style="position:relative;width:48px;height:56px">
      <div style="width:48px;height:48px;border-radius:14px;background:#fff;border:2px solid #0b8c76;
        box-shadow:${ring}0 6px 18px rgba(6,59,50,.35);overflow:hidden;font-family:ui-sans-serif,system-ui,sans-serif;text-align:center">
        <div style="background:${live ? '#ef8268' : '#0b8c76'};color:#fff;font-size:9px;font-weight:900;letter-spacing:.08em;line-height:16px">${live ? 'LIVE' : dow}</div>
        <div style="color:#063b32;font-size:19px;font-weight:900;line-height:28px">${day}</div>
      </div>
      <div style="position:absolute;left:50%;bottom:0;width:12px;height:12px;margin-left:-6px;transform:rotate(45deg);background:#0b8c76;border-radius:2px"></div>
    </div>`,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
  })
}

export function EventLayer({
  events,
  selectedId,
  onSelect,
}: {
  events: Event[]
  selectedId?: string | null
  onSelect: (e: Event) => void
}) {
  return (
    <>
      {events.filter(hasPin).map((e) => (
        <Marker
          key={e.id}
          position={[e.latitude, e.longitude]}
          icon={eventIcon(e, e.id === selectedId)}
          zIndexOffset={1000}
          title={e.title}
          eventHandlers={{ click: () => onSelect(e) }}
        />
      ))}
    </>
  )
}
