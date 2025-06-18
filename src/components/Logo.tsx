import { ClipboardList } from "lucide-react";

export default function Logo() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
          <ClipboardList />
        </div>
        <span className="font-bold text-xl text-foreground">DocsMaker</span>
      </div>
    </div>
  );
}
