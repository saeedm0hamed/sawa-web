"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TvMinimalPlay, Users, MessageCircle, Copy, Check } from "lucide-react";

type WatchPlayerProps = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  initialRoomId?: string;
};

type ChatMessage = {
  id: string;
  userId: string;
  name: string;
  text: string;
  time: number;
};

type SyncEvent = {
  type: "sync";
  action: "play" | "pause" | "seek";
  time: number;
  userId: string;
};

type ChatEvent = {
  type: "chat";
  message: ChatMessage;
};

type SystemEvent = {
  type: "system";
  message: string;
  id?: string;
};

type ServerEvent = SyncEvent | ChatEvent | SystemEvent;

export default function WatchPlayer({ tmdbId, mediaType, initialRoomId }: WatchPlayerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [m3u8Url, setM3u8Url] = useState<string | null>(null);
  const [levels, setLevels] = useState<{ index: number; label: string }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [pendingJoinId, setPendingJoinId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [userId] = useState(() => crypto.randomUUID());
  const [userName] = useState(() => "ضيف");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const applyingRemoteRef = useRef(false);

  const baseRoomUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId || "");
    return url.toString();
  }, [roomId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/extract?tmdb=${tmdbId}&type=${mediaType}`)
      .then(async res => {
        if (!res.ok) throw new Error("فشل في جلب رابط المشاهدة");
        const data = await res.json();
        if (!data.success || !data.url) throw new Error("لم يتم العثور على رابط المشاهدة");
        setM3u8Url(data.url);
      })
      .catch(err => {
        setError(err.message || "خطأ غير متوقع");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tmdbId, mediaType]);

  useEffect(() => {
    if (!m3u8Url) return;
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const available = hls.levels.map((level, index) => {
          const height = level.height || 0;
          const label = height ? `${height}p` : `${Math.round((level.bitrate || 0) / 1000)}kbps`;
          return { index, label };
        });
        setLevels(available);
        setCurrentLevel(hls.currentLevel);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = m3u8Url;
    } else {
      setError("المتصفح لا يدعم تشغيل هذا النوع من الفيديو");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [m3u8Url]);

  const connectRoom = useCallback((id: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    const es = new EventSource(`/api/watch-party/${id}`);
    eventSourceRef.current = es;

    es.onmessage = event => {
      try {
        const data: ServerEvent = JSON.parse(event.data);
        if (data.type === "system") return;
        if (data.type === "chat") {
          setMessages(prev => [...prev, data.message]);
          return;
        }
        if (data.type === "sync") {
          if (data.userId === userId) return;
          const video = videoRef.current;
          if (!video) return;
          applyingRemoteRef.current = true;
          if (Math.abs(video.currentTime - data.time) > 0.5) {
            video.currentTime = data.time;
          }
          if (data.action === "play") {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .catch(() => {
                })
                .finally(() => {
                  applyingRemoteRef.current = false;
                });
            } else {
              applyingRemoteRef.current = false;
            }
          } else if (data.action === "pause") {
            video.pause();
            applyingRemoteRef.current = false;
          } else if (data.action === "seek") {
            applyingRemoteRef.current = false;
          }
        }
      } catch {
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [userId]);

  const sendEvent = async (room: string, payload: Omit<ServerEvent, "room">) => {
    await fetch(`/api/watch-party/${room}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (err: any) {
      const name = err?.name || "";
      const message = err?.message || "";
      if (
        name === "AbortError" ||
        message.includes("The play() request was interrupted") ||
        message.includes("The play() request was interrupted by a call to pause")
      ) {
        return;
      }
      return;
    }
    if (roomId && isHost) {
      const payload: SyncEvent = {
        type: "sync",
        action: "play",
        time: video.currentTime,
        userId,
      };
      sendEvent(roomId, payload);
    }
  };

  const handlePause = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (roomId && isHost && !applyingRemoteRef.current) {
      const payload: SyncEvent = {
        type: "sync",
        action: "pause",
        time: video.currentTime,
        userId,
      };
      sendEvent(roomId, payload);
    }
  };

  const handleQualityChange = (index: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index;
    setCurrentLevel(index);
  };

  const startRoom = () => {
    const id = `${mediaType}-${tmdbId}-${Math.random().toString(36).slice(2, 8)}`;
    setIsHost(true);
    setRoomId(id);
    connectRoom(id);
  };

  const joinRoom = useCallback((id: string, fromInput: boolean) => {
    if (!id) return;
    setIsHost(false);
    setRoomId(id);
    if (fromInput) setPendingJoinId("");
    connectRoom(id);
  }, [connectRoom]);

  useEffect(() => {
    if (!initialRoomId) return;
    joinRoom(initialRoomId, false);
  }, [initialRoomId, joinRoom]);

  const sendChat = async () => {
    if (!roomId) return;
    if (!chatInput.trim()) return;
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      name: userName,
      text: chatInput.trim(),
      time: Date.now(),
    };
    const payload: ChatEvent = {
      type: "chat",
      message,
    };
    await sendEvent(roomId, payload);
    setMessages(prev => [...prev, message]);
    setChatInput("");
  };

  const toggleChat = () => {
    setChatOpen(prev => !prev);
  };

  const handleCopyLink = async () => {
    if (!roomId || !baseRoomUrl) return;
    try {
      await navigator.clipboard.writeText(baseRoomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };

  const handleVideoTimeChange = () => {};

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/20">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
            جاري تجهيز المشغل...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm px-4 text-center">
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full bg-black"
          controls
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleVideoTimeChange}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs md:text-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-white/70">الجودة</span>
          <div className="flex flex-wrap gap-2">
            {levels.length === 0 && (
              <span className="text-white/50">تلقائي</span>
            )}
            {levels.map(level => (
              <button
                key={level.index}
                onClick={() => handleQualityChange(level.index)}
                className={`px-2 py-1 rounded-full border text-xs ${
                  currentLevel === level.index
                    ? "bg-primary text-white border-primary"
                    : "bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            onClick={toggleChat}
            variant="outline"
            className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 flex items-center gap-2"
          >
            <MessageCircle size={16} />
            {chatOpen ? "إخفاء الدردشة" : "عرض الدردشة"}
          </Button>
          {roomId && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-white/70 flex items-center gap-1">
                <Users size={14} />
                غرفة: {roomId.split("-").slice(-1)[0]}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border-white/20"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </Button>
            </div>
          )}
          {!roomId && (
            <>
              <Button
                type="button"
                onClick={startRoom}
                className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white"
              >
                <TvMinimalPlay size={16} />
                بدء مشاهدة جماعية
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="أدخل كود الغرفة"
                  value={pendingJoinId}
                  onChange={e => setPendingJoinId(e.target.value)}
                  className="bg-black/40 border-white/20 text-xs w-32 md:w-40"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => joinRoom(pendingJoinId, true)}
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                >
                  انضمام
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {chatOpen && (
        <div className="border border-white/15 rounded-xl bg-black/40 max-h-64 flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            {messages.length === 0 && (
              <p className="text-white/50 text-center">لا توجد رسائل بعد.</p>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.userId === userId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-2 py-1 ${
                    msg.userId === userId
                      ? "bg-primary text-white"
                      : "bg-white/10 text-white/90"
                  }`}
                >
                  <div className="text-[10px] opacity-80 mb-0.5">
                    {msg.name}
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 p-2 flex gap-2">
            <Input
              placeholder="اكتب رسالة..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="bg-black/60 border-white/20 text-xs"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendChat();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={sendChat}
              className="bg-primary hover:bg-primary/80 text-white px-3"
            >
              إرسال
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
