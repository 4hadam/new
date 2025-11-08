"use client"

import { Play, Volume2, Maximize } from "lucide-react"

export default function PlayerControls() {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#2b2f35]/90 flex items-center justify-between px-4 py-2 text-white text-sm select-none rounded-b-lg">
      <div className="flex items-center space-x-4">
        <button className="hover:opacity-80 transition">
          <Play size={18} fill="white" />
        </button>
        <button className="hover:opacity-80 transition">
          <Volume2 size={18} />
        </button>
        <span className="uppercase font-semibold text-xs tracking-widest">LIVE</span>
      </div>

      <div className="flex items-center space-x-4">
        <button className="hover:opacity-80 transition border border-white/20 rounded-sm p-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M19 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm0 8h-6v-4h6v4z" />
          </svg>
        </button>
        <button className="hover:opacity-80 transition">
          <Maximize size={18} />
        </button>
      </div>
    </div>
  )
}
