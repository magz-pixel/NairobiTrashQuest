import { useState } from 'react'
import { HomePage } from './pages/HomePage'
import { EventsPage } from './pages/EventsPage'

type View = 'map' | 'events'

function App() {
  const [view, setView] = useState<View>('map')

  if (view === 'events') {
    return <EventsPage onBack={() => setView('map')} />
  }

  return <HomePage onNavigateEvents={() => setView('events')} />
}

export default App
