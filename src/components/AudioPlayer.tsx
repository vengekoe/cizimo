import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AudioPlayerProps {
  text: string;
  label?: string;
}

const AudioPlayer = ({ text, label = "Metni Dinle" }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const playAudio = async () => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text }
      });

      if (error) throw error;

      // Base64'ten audio oluştur
      const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audioContent}`).then(r => r.blob());
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audioElement = new Audio(audioUrl);
      setAudio(audioElement);
      
      audioElement.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioElement.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Ses çalınamadı",
          description: "Ses dosyası çalınırken bir hata oluştu",
          variant: "destructive",
        });
      };

      await audioElement.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Ses çalma hatası:', error);
      toast({
        title: "Ses oluşturulamadı",
        description: "Lütfen tekrar deneyin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={playAudio}
      disabled={isLoading}
      size="lg"
      variant="secondary"
      className="text-xl md:text-2xl px-6 py-6 bg-card/90 backdrop-blur-sm hover:scale-110 transition-all duration-300 shadow-xl"
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="w-6 h-6" />
      ) : (
        <Volume2 className="w-6 h-6" />
      )}
      <span className="ml-2">{label}</span>
    </Button>
  );
};

export default AudioPlayer;
