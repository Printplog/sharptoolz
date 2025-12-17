import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TutorialSectionProps {
  tutorialUrl: string;
  tutorialTitle: string;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
}

export default function TutorialSection({
  tutorialUrl,
  tutorialTitle,
  onUrlChange,
  onTitleChange,
}: TutorialSectionProps) {
  return (
    <div className="relative">
      <div 
        className={`
          p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
          ${tutorialUrl.trim() 
            ? 'border-white/50 bg-white/10' 
            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/8'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
            ${tutorialUrl.trim() ? 'bg-white text-black' : 'bg-white/20 text-white/60'}
          `}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Tutorial</h3>
            <p className="text-sm text-white/60">Add a tutorial video to help users</p>
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          {/* Tutorial URL */}
          <div className="space-y-2">
            <Label htmlFor="tutorial-url" className="text-sm font-medium">
              Tutorial URL
            </Label>
            <Input
              id="tutorial-url"
              placeholder="https://youtube.com/watch?v=..."
              value={tutorialUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
            />
          </div>

          {/* Tutorial Title */}
          <div className="space-y-2">
            <Label htmlFor="tutorial-title" className="text-sm font-medium">
              Tutorial Title
            </Label>
            <Input
              id="tutorial-title"
              placeholder="How to use this template"
              value={tutorialTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


