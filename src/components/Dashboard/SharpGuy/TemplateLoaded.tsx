import type { LoadedTemplate } from "@/store/chatStore";
import InlineTemplateEditor from "./InlineTemplateEditor/index";

interface TemplateLoadedProps {
  template: LoadedTemplate;
}

export default function TemplateLoaded({ template }: TemplateLoadedProps) {
  return (
    <InlineTemplateEditor
      templateId={template.id}
      templateName={template.name}
      toolName={template.toolName}
      price={template.price}
      banner={template.banner}
      fieldCount={template.field_count}
      svgContent={template.svg_content}
      initialFields={template.form_fields}
    />
  );
}
