/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useRef, useState } from 'react';
import WatchPlayer from './WatchPlayer';
import { Send, Users, MessageSquare, Play, Pause, Activity } from 'lucide-react';
import usePartySocket from 'partysocket/react';

type Message = {
  id: string;
  senderId: string;
  text?: string;
  type: 'chat' | 'system';
  timestamp: number;
};

type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  lastUpdatedAt: number;
};

// Use localhost:1999 for dev, or infer from environment
const PARTYKIT_HOST =
  'localhost:1999';

export default function PartyRoom({
  partyId,
  url,
  mediaType,
  tmdbId,
}: {
  partyId: string;
  url: string | null;
  mediaType: string;
  tmdbId: string;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userCount, setUserCount] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const [showPauseIndicator, setShowPauseIndicator] = useState(false);

  // We'll generate a random user ID for this session
  const [userId] = useState(() => 'user-' + Math.random().toString(36).substring(2, 9));

  const videoRef = useRef<HTMLVideoElement>(null);
  const isRemoteUpdate = useRef(false);
  const lastServerState = useRef<PlaybackState | null>(null);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: partyId,
    id: userId,
    onOpen() {
      setIsConnected(true);
      console.log('Connected to PartyKit');
    },
    onClose() {
      setIsConnected(false);
      console.log('Disconnected from PartyKit');
    },
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'sync':
            lastServerState.current = data.state;
            applyState(data.state, true); // Force apply on sync
            break;

          case 'play':
          case 'pause':
          case 'seek':
            lastServerState.current = data.state;
            // Only apply if it wasn't sent by us
            if (data.senderId !== userId) {
              applyState(data.state, false);
            }
            break;

          case 'chat':
            addMessage({
              id: Date.now().toString(),
              senderId: data.senderId,
              text: data.text,
              type: 'chat',
              timestamp: data.timestamp,
            });
            break;

          case 'system':
            addMessage({
              id: Date.now().toString(),
              senderId: 'System',
              text: data.message,
              type: 'system',
              timestamp: data.timestamp,
            });
            break;

          case 'update_users':
            setUserCount(data.count);
            break;
        }
      } catch (err) {
        console.error('Failed to parse PartyKit message', err);
      }
    },
  });

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev.slice(-99), msg]);
  };

  const applyState = (state: PlaybackState, force: boolean) => {
    const video = videoRef.current;
    if (!video) return;

    // Calculate where the video SHOULD be right now
    const now = Date.now();
    const timeElapsed = (now - state.lastUpdatedAt) / 1000;
    const targetTime = state.currentTime + (state.isPlaying ? timeElapsed : 0);

    // Block local events from triggering updates
    isRemoteUpdate.current = true;

    // 1. Sync Time
    // Only seek if difference is significant (> 0.5s) or if forced (initial sync)
    if (force || Math.abs(video.currentTime - targetTime) > 0.5) {
      console.log(`[Sync] Seeking to ${targetTime.toFixed(2)}`);
      video.currentTime = targetTime;
    }

    // 2. Sync Play/Pause State
    if (state.isPlaying) {
      if (video.paused) {
        console.log('[Sync] Playing');
        video.play().catch((e) => console.error('Play error:', e));
        setShowPauseIndicator(false);
      }
    } else {
      if (!video.paused) {
        console.log('[Sync] Pausing');
        video.pause();
        setShowPauseIndicator(true);
      }
    }

    // Reset flag after a delay to allow events to fire and settle
    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 500);
  };

  // Periodic Sync Check (Heartbeat)
  // Ensures that if a client drifts significantly, they get pulled back
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastServerState.current || !videoRef.current || !isConnected) return;
      
      const state = lastServerState.current;
      const video = videoRef.current;

      // Only force sync if we are supposed to be playing
      if (state.isPlaying) {
         const now = Date.now();
         const timeElapsed = (now - state.lastUpdatedAt) / 1000;
         const targetTime = state.currentTime + timeElapsed;
         
         if (Math.abs(video.currentTime - targetTime) > 1.5) {
             console.log('[Heartbeat] Drift detected, resyncing...');
             applyState(state, true);
         }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // User Interaction Handlers
  const onPlay = () => {
    if (isRemoteUpdate.current) return;
    console.log('[User] Play');
    
    // Optimistic update logic could go here, but let's keep it simple:
    // Just tell server.
    socket.send(JSON.stringify({
        type: 'play',
        payload: { currentTime: videoRef.current?.currentTime || 0 }
    }));
    setShowPauseIndicator(false);
  };

  const onPause = () => {
    if (isRemoteUpdate.current) return;
    console.log('[User] Pause');
    
    socket.send(JSON.stringify({
        type: 'pause',
        payload: { currentTime: videoRef.current?.currentTime || 0 }
    }));
    setShowPauseIndicator(true);
  };

  const onSeeked = () => {
    if (isRemoteUpdate.current) return;
    console.log('[User] Seeked');
    
    socket.send(JSON.stringify({
        type: 'seek',
        payload: { currentTime: videoRef.current?.currentTime || 0 }
    }));
  };

  // Attach event listeners manually to control 'isRemoteUpdate' check precisely
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);

    return () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('seeked', onSeeked);
    };
  }, []); // Empty deps = run once on mount

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    socket.send(JSON.stringify({
        type: 'chat',
        text: chatInput
    }));
    setChatInput('');
  };

  return (
    <div className='flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto'>
      {/* Main Video Area */}
      <div className='flex-1'>
        <div className='relative group rounded-lg overflow-hidden bg-transparent'>
          <WatchPlayer url={url} ref={videoRef} controls autoplay />

          {/* Visual Indicators Overlay */}
          {showPauseIndicator && (
            <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none transition-all duration-300'>
              <div className='bg-black/80 px-8 py-6 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200 border border-white/10 shadow-2xl'>
                <Pause className='w-16 h-16 text-white drop-shadow-lg' />
                <span className='text-xl font-bold text-white tracking-wider drop-shadow-md'>تم الإيقاف</span>
              </div>
            </div>
          )}

          {/* Connection Status Overlay */}
          {!isConnected && (
            <div className='absolute top-4 right-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 z-30'>
              <Activity className='w-3 h-3 animate-pulse' />
              غير متصل
            </div>
          )}
        </div>

        <div className='mt-4 flex justify-between items-center text-white'>
          <h2 className='text-xl font-bold'>كود الغرفة: {partyId}</h2>
          <div className='flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm'>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'متصل' : 'غير متصل'}
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className='w-full lg:w-80 h-[500px] border border-white/10 bg-white/5 rounded-lg flex flex-col'>
        <div className='p-4 border-b border-gray-800 flex items-center justify-between'>
          <h3 className='text-white font-semibold flex items-center gap-2'>
            <MessageSquare className='w-4 h-4' />
            المحادثة
          </h3>
          <span className='text-xs text-gray-400 flex items-center gap-1'>
            <Users className='w-3 h-3' />
            {userCount} متصل
          </span>
        </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-3'>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.type === 'system'
                    ? 'bg-white/20 text-gray-400 w-full text-center'
                    : msg.senderId === userId
                      ? 'bg-white/50 text-white'
                      : 'bg-white/20 text-gray-200'
                }`}
              >
                {msg.type !== 'system' && msg.senderId !== userId && (
                  <span className='text-xs text-gray-400 block mb-1'>مستخدم {msg.senderId.slice(-4)}</span>
                )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendChat} className='p-3 border-t border-gray-800 flex gap-2'>
          <input
            type='text'
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isConnected ? 'اكتب رسالة...' : 'جارِ الاتصال...'}
            disabled={!isConnected}
            className='flex-1 border border-white/10 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-white/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed'
          />
          <button
            type='submit'
            className='p-2 border-white/10 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-white/50 transition-colors'
            disabled={!isConnected}
          >
            <Send className='w-4 h-4' />
          </button>
        </form>
      </div>
    </div>
  );
}
