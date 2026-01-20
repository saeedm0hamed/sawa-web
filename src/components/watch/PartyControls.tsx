"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, LogIn } from "lucide-react";

export default function PartyControls({ mediaType, tmdbId }: { mediaType: string; tmdbId: string }) {
  const router = useRouter();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [partyIdInput, setPartyIdInput] = useState("");

  const handleCreateParty = () => {
    // Generate a random ID (using simple random for now to avoid deps)
    const newPartyId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    router.push(`/watch/${mediaType}/${tmdbId}/party/${newPartyId}`);
  };

  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (partyIdInput.trim()) {
      router.push(`/watch/${mediaType}/${tmdbId}/party/${partyIdInput.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div className="flex gap-4">
        <button
          onClick={handleCreateParty}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Party
        </button>
        <button
          onClick={() => setIsJoinOpen(!isJoinOpen)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Join Party
        </button>
      </div>

      {isJoinOpen && (
        <form onSubmit={handleJoinParty} className="flex gap-2 w-full max-w-sm animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            value={partyIdInput}
            onChange={(e) => setPartyIdInput(e.target.value)}
            placeholder="Enter Party ID..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Go
          </button>
        </form>
      )}
    </div>
  );
}
