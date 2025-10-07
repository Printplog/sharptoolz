// store/useFormStore.ts
import { create } from "zustand";
import type { FormField } from "@/types";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";

interface ToolStore {
  name: string;
  fields: FormField[];
  svgRaw: string;

  setName: (name: string) => void;
  setFields: (fields: FormField[], isPurchased?: boolean) => void;
  updateField: (fieldId: string, value: string | number | boolean) => void;
  uploadFile: (fieldId: string, file: File) => void;
  resetForm: () => void;
  getFieldValue: (fieldId: string) => string | number | boolean | undefined;
  setSvgRaw: (svg: string) => void;
  downloadSvg: (fileName?: string) => void;
}

const  useToolStore = create<ToolStore>((set, get) => ({
  name: "",
  fields: [] as FormField[],
  svgRaw: "",

  setName: (name) => set({ name }),

  setFields: (fields, isPurchased) => {
    const initializedFields = fields?.map((field) => ({
      ...field,
      currentValue: field.defaultValue ?? "",
    }));

    if (isPurchased) {
      set({ fields });
    } else {
      set({ fields: initializedFields });
    }
  },

  updateField: (fieldId, value) => {
    set((state) => ({
      fields: state.fields?.map((field) =>
        field.id === fieldId ? { ...field, currentValue: value } : field
      ),
    }));
  },

  uploadFile: (fieldId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      set((state) => ({
        fields: state.fields?.map((field) =>
          field.id === fieldId ? { ...field, currentValue: dataUrl } : field
        ),
      }));
    };
    reader.readAsDataURL(file);
  },

  resetForm: () => {
    set((state) => ({
      fields: state.fields?.map((field) => ({
        ...field,
        currentValue: field?.defaultValue ?? "",
      })),
    }));
  },

  getFieldValue: (fieldId) => {
    return get().fields?.find((f) => f.id === fieldId)?.currentValue;
  },

  setSvgRaw: (svg) => set({ svgRaw: svg }),

  downloadSvg: (fileName = "form-output.svg") => {
    const { svgRaw, fields } = get();

    const updatedSvg = updateSvgFromFormData(svgRaw, fields);
    const blob = new Blob([updatedSvg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
  },

}));


export default useToolStore;