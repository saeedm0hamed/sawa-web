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
  playbackRate: number;
  version?: number;
};

// Use localhost:1999 for dev, or infer from environment
const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

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
  const [latency, setLatency] = useState(0);

  // We'll generate a random user ID for this session
  const [userId] = useState(() => 'user-' + Math.random().toString(36).substring(2, 9));

  const videoRef = useRef<HTMLVideoElement>(null);
  const isRemoteUpdate = useRef(false);
  const lastServerState = useRef<PlaybackState | null>(null);
  const lastLocalSyncTime = useRef<number>(0);
  const lastLocalInteractionTime = useRef<number>(0);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: partyId,
    onOpen() {
      setIsConnected(true);
      // Measure latency on connect
      const start = Date.now();
      socket.send(JSON.stringify({ type: 'ping', id: start }));
    },
    onClose() {
      setIsConnected(false);
    },
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);

        // Handle different event types
        if (data.type === 'system') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              senderId: 'System',
              text: data.message,
              type: 'system',
              timestamp: data.timestamp,
            },
          ]);
        } else if (data.type === 'update_users') {
          setUserCount(data.count);
        } else if (data.type === 'chat') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              senderId: data.senderId,
              text: data.payload.text,
              type: 'chat',
              timestamp: data.timestamp,
            },
          ]);
        } else if (data.type === 'pong') {
          const rtt = Date.now() - data.id;
          setLatency(rtt / 2);
          // console.log('Latency:', rtt / 2);
        } else if (data.type === 'sync') {
          handleSync(data.state);
        } else if (['play', 'pause', 'seek'].includes(data.type)) {
          // Update server state reference
          const newState: PlaybackState = {
            isPlaying: data.type === 'play',
            currentTime: data.payload.currentTime,
            lastUpdatedAt: data.timestamp,
            playbackRate: 1,
            version: data.payload.version,
          };
          lastServerState.current = newState;
          lastLocalSyncTime.current = Date.now();

          // Ignore our own events for direct control, but update state above
          if (data.senderId === userId) return;

          handleRemoteMediaEvent(data.type, data.payload);
        }
      } catch (err) {
        console.error('Failed to parse PartyKit message', err);
      }
    },
  });

  const handleSync = (state: PlaybackState) => {
    lastServerState.current = state;
    lastLocalSyncTime.current = Date.now();

    const video = videoRef.current;
    if (!video) return;

    isRemoteUpdate.current = true;

    // Calculate target time compensating for latency if playing
    // We use 0 latency assumption for simplicity or use the measured latency
    const targetTime = state.currentTime + (state.isPlaying ? latency / 1000 : 0);

    if (Math.abs(video.currentTime - targetTime) > 0.5) {
      video.currentTime = targetTime;
    }

    if (state.isPlaying) {
      video.play().catch(() => {});
      setShowPauseIndicator(false);
    } else {
      video.pause();
      setShowPauseIndicator(true);
    }

    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 500);
  };

  const handleRemoteMediaEvent = (type: string, payload: any) => {
    const video = videoRef.current;
    if (!video) return;

    isRemoteUpdate.current = true;

    if (type === 'play') {
      // Sync time if significantly different (> 0.5s)
      // Add latency compensation
      const targetTime = payload.currentTime + latency / 1000;
      if (Math.abs(video.currentTime - targetTime) > 0.5) {
        video.currentTime = targetTime;
      }
      video.play().catch(() => {});
      setShowPauseIndicator(false);
    } else if (type === 'pause') {
      video.pause();
      video.currentTime = payload.currentTime;
      setShowPauseIndicator(true);
    } else if (type === 'seek') {
      video.currentTime = payload.currentTime;
    }

    // Reset flag after a short delay
    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 500);
  };

  // Drift correction loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastServerState.current || !videoRef.current || !isConnected) return;

      // Skip drift check if user interacted recently (2s buffer)
      if (Date.now() - lastLocalInteractionTime.current < 2000) return;

      const state = lastServerState.current;
      const video = videoRef.current;

      // Only check drift if server thinks we are playing
      if (state.isPlaying) {
        // Expected time = state.currentTime + (time since last local sync)
        const timeSinceSync = (Date.now() - lastLocalSyncTime.current) / 1000;
        const expectedTime = state.currentTime + timeSinceSync;

        // Check drift
        const drift = Math.abs(video.currentTime - expectedTime);

        // If drift is large (> 1s), snap to expected time
        if (drift > 1.0) {
          console.log(`[Drift] Correcting drift of ${drift.toFixed(2)}s. Target: ${expectedTime.toFixed(2)}`);
          isRemoteUpdate.current = true;
          video.currentTime = expectedTime;
          if (video.paused) video.play().catch(() => {});

          setTimeout(() => {
            isRemoteUpdate.current = false;
          }, 500);
        }
      } else {
        // Server is paused

        // 1. Enforce Pause State
        if (!video.paused) {
          console.log(`[Drift] Force Pause. Server is paused but video is playing.`);
          isRemoteUpdate.current = true;
          video.pause();
          setShowPauseIndicator(true);

          setTimeout(() => {
            isRemoteUpdate.current = false;
          }, 500);
        }

        // 2. Enforce Time Sync (even when paused)
        const drift = Math.abs(video.currentTime - state.currentTime);
        if (drift > 1.0) {
          console.log(
            `[Drift] Correcting paused time drift of ${drift.toFixed(2)}s. Target: ${state.currentTime.toFixed(2)}`,
          );
          isRemoteUpdate.current = true;
          video.currentTime = state.currentTime;

          setTimeout(() => {
            isRemoteUpdate.current = false;
          }, 500);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected, latency]);

  const broadcastEvent = (type: string, payload: any) => {
    socket.send(
      JSON.stringify({
        type,
        payload,
        senderId: userId,
      }),
    );
  };

  const onPlay = () => {
    console.log('[User] Play');
    lastLocalInteractionTime.current = Date.now();
    setShowPauseIndicator(false);

    // Optimistic Update: Assume server will accept play
    if (lastServerState.current) {
      lastServerState.current = {
        ...lastServerState.current,
        isPlaying: true,
        currentTime: videoRef.current?.currentTime || 0,
        lastUpdatedAt: Date.now(),
      };
      lastLocalSyncTime.current = Date.now();
    }

    if (isRemoteUpdate.current) {
      console.log('[User] Play ignored (Remote Update)');
      return;
    }
    const video = videoRef.current;
    broadcastEvent('play', { currentTime: video?.currentTime || 0 });
  };

  const onPause = () => {
    console.log('[User] Pause');
    lastLocalInteractionTime.current = Date.now();
    setShowPauseIndicator(true);

    // Optimistic Update: Assume server will accept pause
    if (lastServerState.current) {
      lastServerState.current = {
        ...lastServerState.current,
        isPlaying: false,
        currentTime: videoRef.current?.currentTime || 0,
        lastUpdatedAt: Date.now(),
      };
      lastLocalSyncTime.current = Date.now();
    }

    if (isRemoteUpdate.current) {
      console.log('[User] Pause ignored (Remote Update)');
      return;
    }
    const video = videoRef.current;
    broadcastEvent('pause', { currentTime: video?.currentTime || 0 });
  };

  const onSeeked = () => {
    console.log('[User] Seeked');
    lastLocalInteractionTime.current = Date.now();

    // Optimistic Update: Update time but keep current playing state
    if (lastServerState.current) {
      lastServerState.current = {
        ...lastServerState.current,
        currentTime: videoRef.current?.currentTime || 0,
        lastUpdatedAt: Date.now(),
      };
      lastLocalSyncTime.current = Date.now();
    }

    if (isRemoteUpdate.current) {
      console.log('[User] Seek ignored (Remote Update)');
      return;
    }
    const video = videoRef.current;
    broadcastEvent('seek', { currentTime: video?.currentTime || 0 });
  };

  // Attach event listeners to video ref
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
  }, []);

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    broadcastEvent('chat', { text: chatInput });
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

          {/* Connection Status Overlay (Optional, for debugging or bad connection) */}
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
            placeholder='اكتب رسالة...'
            className='flex-1 border border-white/10 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-red-500 outline-none'
          />
          <button
            type='submit'
            className='p-2 border-white/10 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-red-500 transition-colors'
            disabled={!isConnected}
          >
            <Send className='w-4 h-4' />
          </button>
        </form>
      </div>
    </div>
  );
}
