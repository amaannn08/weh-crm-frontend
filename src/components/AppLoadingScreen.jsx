import React from 'react'

function AppLoadingScreen({ label = 'Loading workspace...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] text-[#1A1815]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#E8E5DE] border-t-[#FF7102]" />
        <p className="text-[13px] font-medium text-[#5A5650]">{label}</p>
      </div>
    </div>
  )
}

export default AppLoadingScreen
