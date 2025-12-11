import { Checkbox } from "@/components/ui/checkbox";

interface TemplateTogglesProps {
  isHot: boolean;
  isActive: boolean;
  onHotChange: (hot: boolean) => void;
  onActiveChange: (active: boolean) => void;
}

export default function TemplateToggles({
  isHot,
  isActive,
  onHotChange,
  onActiveChange,
}: TemplateTogglesProps) {
  return (
    <>
      {/* Hot Template Toggle */}
      <div className="relative">
        <div 
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
            ${isHot 
              ? 'border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/20' 
              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }
          `}
          onClick={() => onHotChange(!isHot)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                text-2xl transition-all duration-200
                ${isHot ? 'animate-pulse' : 'grayscale opacity-50'}
              `}>
                🔥
              </div>
              <div>
                <div className="font-medium text-sm">
                  Hot Template
                </div>
                <div className="text-xs text-white/60">
                  Featured prominently on homepage
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Checkbox 
                id="hot-template"
                checked={isHot}
                onCheckedChange={(checked) => onHotChange(checked === true)}
                className="pointer-events-none"
              />
            </div>
          </div>
          
          {isHot && (
            <div className="mt-2 pt-2 border-t border-orange-500/20">
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                This template will be featured on the homepage
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Template Toggle */}
      <div className="relative">
        <div 
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
            ${isActive 
              ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20' 
              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }
          `}
          onClick={() => onActiveChange(!isActive)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                text-2xl transition-all duration-200
                ${isActive ? 'animate-pulse' : 'grayscale opacity-50'}
              `}>
                ✓
              </div>
              <div>
                <div className="font-medium text-sm">
                  Published
                </div>
                <div className="text-xs text-white/60">
                  Make this template visible to users in listings
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Checkbox 
                id="active-template"
                checked={isActive}
                onCheckedChange={(checked) => onActiveChange(checked === true)}
                className="pointer-events-none"
              />
            </div>
          </div>
          
          {isActive && (
            <div className="mt-2 pt-2 border-t border-green-500/20">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                This template is visible to users
              </div>
            </div>
          )}
          {!isActive && (
            <div className="mt-2 pt-2 border-t border-red-500/20">
              <div className="flex items-center gap-1 text-xs text-red-400">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                This template will be hidden from users
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

