import { LazyImage } from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import SectionPadding from "@/layouts/SectionPadding";
import { cn } from "@/lib/utils";

export default function JoinCommunity() {
  return (
    <SectionPadding className="py-20 flex flex-col items-center justify-center text-center space-y-6">
      <LazyImage
        src="/whatsapp.png"
        alt="Megaphone icon"
        className="w-[200px]"
        style={{ backgroundColor: 'transparent' }}
      />

      <h2 className="text-3xl font-bold text-foreground">
        Join Our WhatsApp Community
      </h2>

      <p className="text-muted-foreground max-w-md">
        Connect with other members, get exclusive updates, and participate in
        live discussions — all in one vibrant community.
      </p>

      <Button
        size="lg"
        className={cn(
          "bg-[#0a712c] text-white px-6 py-3 rounded-full text-base font-medium",
          "shadow-[0_0_15px_#0a712c] hover:shadow-[0_0_25px_#0a712c]",
          "hover:scale-105 transition-all duration-200 ease-out"
        )}
        asChild
      >
        <a
          href="https://chat.whatsapp.com/YOUR_INVITE_LINK_HERE"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join on WhatsApp
        </a>
      </Button>
    </SectionPadding>
  );
}
