import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Header from '../components/header'
import SidebarNav from '../components/SidebarNav'

function AppLayout({ children }) {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const isCallsRoute =
    location.pathname === '/calls' ||
    location.pathname === '/assistant' ||
    location.pathname.startsWith('/assistant/')

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#FAFAF8] text-[#1A1815]">
      <Header />

      <div className="flex min-h-0 flex-1 border-t border-[#E8E5DE] relative overflow-hidden">
        <SidebarNav isOpen={isSidebarOpen} />
        
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E5DE] bg-white text-[#5A5650] shadow-sm hover:bg-[#F5F4F0] transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'left-[228px]' : 'left-4'
          }`}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <main className="relative flex min-h-0 flex-1 justify-center overflow-auto bg-[#FAFAF8]">
          <div
            className={`flex min-h-0 w-full flex-col gap-4 pb-2 ${isCallsRoute ? 'pt-0 px-0' : 'pt-4 px-6'
              }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout

