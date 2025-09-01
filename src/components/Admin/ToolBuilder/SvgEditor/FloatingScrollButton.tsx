// FloatingScrollButton component for scroll-to-top functionality
import { Button } from "@/components/ui/button";

interface FloatingScrollButtonProps {
  show: boolean;
  onClick: () => void;
}

export default function FloatingScrollButton({ show, onClick }: FloatingScrollButtonProps) {
  if (!show) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg"
      size="sm"
      title="Scroll to top"
    >
      ↑
    </Button>
  );
}
