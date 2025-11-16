import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginPromptProps {
  open: boolean;
  onClose: () => void;
}

const LoginPrompt = ({ open, onClose }: LoginPromptProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">İlerlemenizi Kaydedin</DialogTitle>
          <DialogDescription className="text-lg">
            Kitabı okumaya devam edebilmek için giriş yapın veya hesap oluşturun.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <Button size="lg" className="text-xl py-6">
            Giriş Yap
          </Button>
          <Button size="lg" variant="outline" className="text-xl py-6">
            Hesap Oluştur
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPrompt;
