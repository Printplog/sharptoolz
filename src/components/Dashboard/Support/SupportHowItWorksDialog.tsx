import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STEPS = [
  ["Live chat", "Starts from the floating support button. Replies appear instantly while the customer keeps the conversation on that browser."],
  ["Email support", "Starts from the full contact form. Replies are delivered by email and also remain in this inbox."],
  ["Tracking link", "Both types use the tracking ID to route the conversation to the owner of the correct document."],
];

export function SupportHowItWorksDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0"><CircleHelp className="size-4" /> How it works</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 rounded-xl border-white/10 bg-[#101721] p-0">
        <DialogHeader className="border-b border-white/10 px-6 py-5 pr-12">
          <DialogTitle>How support messages work</DialogTitle>
          <DialogDescription className="text-white/40">Two ways to contact you, managed from one inbox.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-2">
          {STEPS.map(([title, description]) => (
            <div key={title} className="border-b border-white/[0.07] py-5 last:border-0">
              <h3 className="text-sm font-medium text-white/80">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/40">{description}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
