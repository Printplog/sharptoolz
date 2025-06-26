// components/SvgFormTranslator.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "./FormPanel";
import { useEffect, useState } from "react";
import parseSvgToFormFields from "@/lib/utils/parseSvgToFormFields";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router-dom";
import { getPurchasedTemplate, getTemplate } from "@/api/apiEndpoints";
import type { FormField, PurchasedTemplate, Template } from "@/types";

export default function SvgFormTranslator() {
  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");

  const setFields = useToolStore((state) => state.setFields);
  const setSvgRaw = useToolStore((state) => state.setSvgRaw);
  const setName = useToolStore((state) => state.setName);
  const setStatus = useToolStore((state) => state.setStatus);
  const fields = useToolStore((s) => s.fields);
  const { id } = useParams<{ id: string }>()
  const pathname = useLocation().pathname

  // Fetch /card.svg on mount
  const isPurchased = pathname.includes("documents");
  const { data } = useQuery<PurchasedTemplate | Template>({
    queryKey: [isPurchased ? "purchased-template" : "template"],
    queryFn: () =>
      isPurchased
        ? getPurchasedTemplate(id as string)
        : getTemplate(id as string),
  });

  useEffect(() => {
    setSvgText(data?.svg as string)
  }, [data]);

  useEffect(() => {
    if (!svgText) return;
    const parsedFields = parseSvgToFormFields(svgText);
    setSvgRaw(svgText);
    setName(data?.name as string)
    setStatus((data as PurchasedTemplate)?.status ?? '');
    setFields(data?.form_fields as FormField[]);
    console.log(parsedFields);
  }, [svgText, setFields, setSvgRaw, data, setName, setStatus ]);

  useEffect(() => {
    if (!svgText) return;
    const updatedSvg = updateSvgFromFormData(svgText, fields);
    setLivePreview(updatedSvg);
  }, [fields, svgText]);

  return (
    <div>
      <Tabs defaultValue="editor" className="w-full px-0">
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
