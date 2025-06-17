// components/SvgFormTranslator.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "./FormPanel";
import { useEffect, useState } from "react";
import parseSvgToFormFields from "@/lib/utils/parseSvgToFormFields";
import useFormStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";

export default function SvgFormTranslator() {
  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");

  const setFields = useFormStore((state) => state.setFields);
  const setSvgRaw = useFormStore((state) => state.setSvgRaw);
  const fields = useFormStore((s) => s.fields);
  // const formData = useFormStore((s) => s.formData);

  // Fetch /card.svg on mount
  useEffect(() => {
    fetch("/card.svg")
      .then((res) => res.text())
      .then((data) => setSvgText(data))
      .catch((err) => console.error("Failed to load SVG:", err));
  }, []);

  useEffect(() => {
    if (!svgText) return;
    const parsedFields = parseSvgToFormFields(svgText);
    setSvgRaw(svgText);
    setFields(parsedFields);
    console.log(parsedFields);
  }, [svgText, setFields, setSvgRaw]);

  useEffect(() => {
    if (!svgText) return;
    const updatedSvg = updateSvgFromFormData(svgText, fields);
    setLivePreview(updatedSvg);
    console.log(fields);
  }, [fields, svgText]);

  return (
    <div>
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="bg-white/10 w-full">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="editor">
          <FormPanel />
        </TabsContent>
        <TabsContent value="preview">
          <div className="w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl">
            <div className="min-w-[300px] inline-block max-w-full">
              <div
                className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: livePreview }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
