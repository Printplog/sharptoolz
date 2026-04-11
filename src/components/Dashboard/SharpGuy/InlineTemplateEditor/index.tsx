import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  getTemplate,
  getTemplateSvgForAdmin,
  purchaseTemplate as apiPurchase,
} from "@/api/apiEndpoints";
import type { FormField } from "@/types";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { generateValue } from "@/lib/utils/fieldGenerator";
import useChatStore from "@/store/chatStore";

import { EditorHeader } from "./EditorHeader";
import { EditorPreview } from "./EditorPreview";
import { EditorActions } from "./EditorActions";

export interface InlineTemplateEditorProps {
  templateId: string;
  templateName: string;
  toolName: string;
  price: string;
  banner: string;
  fieldCount: number;
  svgContent?: string;
  initialFields?: FormField[];
  onPurchased?: (purchasedId: string) => void;
  onOpenFullEditor?: () => void;
}

export default function InlineTemplateEditor(props: InlineTemplateEditorProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [livePreview, setLivePreview] = useState<string>("");
  const [purchased, setPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const baseSvgDocRef = useRef<Document | null>(null);
  const fieldsRef = useRef<FormField[]>([]);
  
  const {
    svgCache,
    cacheSvg,
    setActiveTemplateFields,
  } = useChatStore();

  const updatePreview = useCallback((baseDoc: Document, currentFields: FormField[]) => {
    try {
      const workDoc = baseDoc.cloneNode(true) as Document;
      const processedFields = currentFields.map((f) => {
        if (f.generationRule?.startsWith("AUTO:")) {
          return { ...f, currentValue: generateValue(f.generationRule!) };
        }
        return f;
      });
      updateSvgFromFormData(workDoc, processedFields);

      const svgEl = workDoc.documentElement;
      if (!svgEl.getAttribute("viewBox")) {
        const w = svgEl.getAttribute("width") || "800";
        const h = svgEl.getAttribute("height") || "600";
        svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");
      svgEl.setAttribute("style", "width:100%;height:100%;display:block;");

      const serialized = new XMLSerializer().serializeToString(workDoc);
      setLivePreview(serialized);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let svgText: string;
        let parsedFields: FormField[];

        if (props.svgContent && props.initialFields) {
          svgText = props.svgContent;
          parsedFields = props.initialFields;
        } else if (svgCache[props.templateId]) {
          svgText = svgCache[props.templateId];
          const tpl = await getTemplate(props.templateId);
          parsedFields = tpl.form_fields?.map((f: any) => ({
            ...f,
            currentValue: f.currentValue ?? f.defaultValue ?? "",
          })) || [];
        } else {
          const [tpl, svg] = await Promise.all([
            getTemplate(props.templateId),
            getTemplateSvgForAdmin(props.templateId),
          ]);
          svgText = svg;
          cacheSvg(props.templateId, svgText);
          parsedFields = tpl.form_fields?.map((f: any) => ({
            ...f,
            currentValue: f.currentValue ?? f.defaultValue ?? "",
          })) || [];
        }

        if (cancelled) return;
        fieldsRef.current = parsedFields;
        setActiveTemplateFields(parsedFields);

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        baseSvgDocRef.current = doc;
        updatePreview(doc, parsedFields);
      } catch (err) {
        console.error("Failed to load template:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [props.templateId, props.svgContent, props.initialFields]);

  const handleFieldUpdate = useCallback((fieldId: string, value: string) => {
    const updated = fieldsRef.current.map((f) => f.id === fieldId ? { ...f, currentValue: value } : f);
    fieldsRef.current = updated;
    if (baseSvgDocRef.current) updatePreview(baseSvgDocRef.current, updated);
  }, [updatePreview]);

  useEffect(() => {
    (window as any).__inlineEditorUpdateField = handleFieldUpdate;
    return () => { delete (window as any).__inlineEditorUpdateField; };
  }, [handleFieldUpdate]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const result = await apiPurchase({ template: props.templateId, form_fields: fieldsRef.current });
      setPurchased(true);
      props.onPurchased?.(result.id);
    } catch (err) { console.error(err); } finally { setPurchasing(false); }
  };

  if (loading) {
    return (
      <div className="w-full mt-3 animate-in fade-in duration-300">
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/4 px-3.5 py-3 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-indigo-400" />
          <p className="text-[12px] text-indigo-200">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-3 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
        <EditorHeader {...props} onOpenFullEditor={props.onOpenFullEditor || (() => navigate(`/tools/${props.templateId}?tab=ai`))} />
        <EditorPreview livePreview={livePreview} />
        <EditorActions price={props.price} purchased={purchased} purchasing={purchasing} handlePurchase={handlePurchase} handleDownload={(fmt) => navigate(`/tools/${props.templateId}?download=${fmt}`)} />
      </div>
    </div>
  );
}
