/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, LogIn, TvMinimalPlay, SquareArrowUp } from 'lucide-react';
import { Button } from '../ui/button';

export default function PartyControls({ mediaType, tmdbId }: { mediaType: string; tmdbId: string }) {
  const router = useRouter();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [partyIdInput, setPartyIdInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateParty = () => {
    const newPartyId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    router.push(`/watch/${mediaType}/${tmdbId}/party/${newPartyId}`);
  };

  const handleJoinParty = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (partyIdInput.trim()) {
      router.push(`/watch/${mediaType}/${tmdbId}/party/${partyIdInput.trim()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoinParty(e);
    }
  };

  // Handle Focus on Input
  useEffect(() => {
    if (isJoinOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isJoinOpen]);

  // Close Input When Clicked Outside
  useEffect(() => {
    const closeInput = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsJoinOpen(false);
        setPartyIdInput('');
      }
    };
    if (isJoinOpen) {
      setTimeout(() => window.addEventListener('click', closeInput), 100);
    }
    return () => window.removeEventListener('click', closeInput);
  }, [isJoinOpen]);

  const handleJoinButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isJoinOpen) {
      handleJoinParty(e);
    } else {
      setIsJoinOpen(true);
    }
  };

  return (
    <div className='flex flex-col md:flex-row flex-1 gap-2 justify-start'>
      <Button
        type='button'
        onClick={handleCreateParty}
        className='w-3xs xl:w-3xs border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 rounded-lg flex items-center justify-center gap-2'
      >
        <Plus size={16} className='text-white/80' />
        بدء غرفة مشاهدة جماعية
        <Users size={16} className='text-white/80' />
      </Button>
      <div className='relative w-3xs xl:w-3xs' ref={searchContainerRef}>
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isJoinOpen ? 'opacity-100 w-full' : 'opacity-0 w-0'
          }`}
        >
          <form onSubmit={handleJoinParty} className='h-full'>
            <input
              ref={inputRef}
              type='text'
              value={partyIdInput}
              onChange={(e) => setPartyIdInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='اكتب كود الغرفة...'
              autoFocus={true}
              className='w-full h-full border border-white/10 bg-white/5 py-2 px-3 pr-10 rounded-lg text-white/90 outline-none focus:bg-white/10 focus:border-white/20'
              onClick={(e) => e.stopPropagation()}
            />

            <Button
              type='submit'
              onClick={handleJoinButtonClick}
              className={`absolute top-0 right-0 bg-transparent hover:bg-transparent rounded-lg flex items-center justify-center gap-2 transition-all duration-300`}
            >
              <SquareArrowUp size={16} className='text-white/80' />
            </Button>
          </form>
        </div>
        <Button
          type='button'
          onClick={handleJoinButtonClick}
          className={`absolute top-0 right-0 w-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
            isJoinOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <SquareArrowUp size={16} className='text-white/80' />
          دخول غرفة مشاهدة جماعية
          <Users size={16} className='text-white/80' />
        </Button>
      </div>
    </div>
  );
}
