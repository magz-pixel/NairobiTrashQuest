import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  )
}

export default App
