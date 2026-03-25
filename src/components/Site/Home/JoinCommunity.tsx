import { LazyImage } from "@/components/LazyImage";
import SectionPadding from "@/layouts/SectionPadding";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { MessageCircle } from "lucide-react";

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

      <PremiumButton
        text="Join on WhatsApp"
        icon={MessageCircle}
        href="https://chat.whatsapp.com/HMkF0uqv3ksC0QvNbr8Mqu"
        className="bg-[#0a712c] text-white shadow-[#0a712c]/20 min-w-[200px]"
        iconRotation={0}
      />
    </SectionPadding>
  );
}
