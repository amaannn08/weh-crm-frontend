import React, { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import DashboardPage from './pages/Dashboard'
import CallsPage from './pages/Calls'
import DealsPage from './pages/Deals'
import DealDetailPage from './pages/DealDetail'
import MeetingsPage from './pages/Meetings'
import MeetingDetailPage from './pages/MeetingDetail'
import PortfolioNewsPage from './pages/PortfolioNews'
import SeedFounderPage from './pages/SeedFounder'
import LoginPage from './pages/Login'
import { useAuth } from './context/AuthContext'
import { useDealData } from './context/DealDataContext'
import AppLoadingScreen from './components/AppLoadingScreen'
import { preloadSeedFounderData } from './utils/dataPreloader'

function ProtectedRoute({ children }) {
  const { isAuthenticated, authResolved } = useAuth()
  if (!authResolved) return <AppLoadingScreen label="Loading workspace..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicLoginOnly({ children }) {
  const { isAuthenticated, authResolved } = useAuth()
  if (!authResolved) return <AppLoadingScreen label="Loading workspace..." />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function AuthedLayout({ children }) {
  const { isBootstrapping } = useDealData()
  const { isAuthenticated } = useAuth()

  // Preload seed founder data on app startup (after auth)
  useEffect(() => {
    if (isAuthenticated && !isBootstrapping) {
      preloadSeedFounderData()
    }
  }, [isAuthenticated, isBootstrapping])

  return (
    <ProtectedRoute>
      {isBootstrapping ? (
        <AppLoadingScreen label="Preparing your workspace..." />
      ) : (
        <AppLayout>{children}</AppLayout>
      )}
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicLoginOnly>
              <LoginPage />
            </PublicLoginOnly>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <AuthedLayout>
              <DashboardPage />
            </AuthedLayout>
          }
        />

        <Route
          path="/calls"
          element={
            <AuthedLayout>
              <CallsPage />
            </AuthedLayout>
          }
        />

        <Route
          path="/assistant"
          element={
            <AuthedLayout>
              <CallsPage />
            </AuthedLayout>
          }
        />
        <Route
          path="/assistant/:conversationId"
          element={
            <AuthedLayout>
              <CallsPage />
            </AuthedLayout>
          }
        />

        <Route
          path="/deals"
          element={
            <AuthedLayout>
              <DealsPage />
            </AuthedLayout>
          }
        />
        <Route
          path="/deals/:dealId"
          element={
            <AuthedLayout>
              <DealDetailPage />
            </AuthedLayout>
          }
        />

        <Route
          path="/meetings"
          element={
            <AuthedLayout>
              <MeetingsPage />
            </AuthedLayout>
          }
        />
        <Route
          path="/meetings/:dealId"
          element={
            <AuthedLayout>
              <MeetingDetailPage />
            </AuthedLayout>
          }
        />

        <Route
          path="/portfolio-news"
          element={
            <AuthedLayout>
              <PortfolioNewsPage />
            </AuthedLayout>
          }
        />

        <Route
          path="/seed-founder"
          element={
            <AuthedLayout>
              <SeedFounderPage />
            </AuthedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
