import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2, Square } from "lucide-react";
import { toast } from "sonner";

interface AudioPlayerProps {
  text: string;
  className?: string;
  variant?: "default" | "icon";
  autoPlay?: boolean;
}

const AudioPlayer = ({ text, className = "", variant = "default", autoPlay = false }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Stop audio when text changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [text]);

  const playAudio = async () => {
    // Toggle pause if already playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Ses oluşturulamadı");
      }

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error("Ses içeriği alınamadı");
      }

      // Cleanup previous audio
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      // Create audio from base64
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;
      
      audioElement.onended = () => {
        setIsPlaying(false);
      };

      audioElement.onerror = () => {
        setIsPlaying(false);
        toast.error("Ses çalınamadı");
      };

      await audioElement.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Ses çalma hatası:", error);
      toast.error(error instanceof Error ? error.message : "Ses oluşturulamadı");
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        onClick={isPlaying ? stopAudio : playAudio}
        disabled={isLoading}
        size="icon"
        variant="secondary"
        className={`bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border-0 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={isPlaying ? stopAudio : playAudio}
      disabled={isLoading}
      size="lg"
      variant="secondary"
      className={`bg-card/90 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-xl ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : isPlaying ? (
        <Square className="w-5 h-5 fill-current mr-2" />
      ) : (
        <Volume2 className="w-5 h-5 mr-2" />
      )}
      <span>{isPlaying ? "Durdur" : "Dinle"}</span>
    </Button>
  );
};

export default AudioPlayer;
