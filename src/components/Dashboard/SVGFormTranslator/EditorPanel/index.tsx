import { useEffect, useRef } from "react";
import FormPanel from "../FormPanel";

function ActionButtonsRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cloneButtons = () => {
      const formPanel = document.querySelector("[data-form-panel-user]");
      const targetContainer = containerRef.current;
      if (!formPanel || !targetContainer) return;

      const buttonsContainer = formPanel.querySelector(
        "div.pt-4.border-t.border-white\\/20.flex:last-child"
      ) as HTMLElement;
      if (!buttonsContainer) return;

      const originalButtons = buttonsContainer.querySelectorAll("button, a");

      while (targetContainer.firstChild) {
        targetContainer.removeChild(targetContainer.firstChild);
      }

      originalButtons.forEach((originalBtn) => {
        const cloned = originalBtn.cloneNode(true) as HTMLElement;
        if (originalBtn instanceof HTMLElement) {
          cloned.className = originalBtn.className;
          const originalStyle = originalBtn.getAttribute("style");
          if (originalStyle) cloned.setAttribute("style", originalStyle);
          if (originalBtn.hasAttribute("disabled")) cloned.setAttribute("disabled", "");
          cloned.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            (originalBtn as HTMLElement).click();
          });
          targetContainer.appendChild(cloned);
        }
      });
    };

    const timeout = setTimeout(cloneButtons, 200);

    const formPanel = document.querySelector("[data-form-panel-user]");
    const buttonsContainer = formPanel?.querySelector(
      "div.pt-4.border-t.border-white\\/20.flex:last-child"
    );
    let observer: MutationObserver | null = null;
    if (buttonsContainer) {
      observer = new MutationObserver(cloneButtons);
      observer.observe(buttonsContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "class", "style"],
      });
    }

    return () => {
      clearTimeout(timeout);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pt-4 border-t border-white/20 flex flex-col lg:flex-row justify-end gap-5"
    />
  );
}

interface EditorPanelProps {
  isPurchased: boolean;
  test?: boolean;
  tutorial?: any;
  templateId?: string;
  toolPrice?: number;
  keywords?: string[];
}

export default function EditorPanel({
  isPurchased,
  test,
  tutorial,
  templateId,
  toolPrice,
  keywords,
}: EditorPanelProps) {
  return (
    <>
      <div data-form-panel-user>
        <FormPanel
          test={!!test}
          tutorial={tutorial}
          templateId={templateId}
          isPurchased={isPurchased}
          toolPrice={toolPrice}
          keywords={keywords || []}
        />
      </div>
      <ActionButtonsRenderer />
    </>
  );
}
