// store/useFormStore.ts
import { create } from "zustand";
import type { FormField } from "@/types";
import updateSvgFromFields from "@/lib/utils/updateSvgFromFormData";

interface FormStore {
  fields: FormField[];
  svgRaw: string;

  setFields: (fields: FormField[]) => void;
  updateField: (fieldId: string, value: string | number | boolean) => void;
  uploadFile: (fieldId: string, file: File) => void;
  resetForm: () => void;
  getFieldValue: (fieldId: string) => string | number | boolean | undefined;
  setSvgRaw: (svg: string) => void;
  downloadSvg: (fileName?: string) => void;
}

const useFormStore = create<FormStore>((set, get) => ({
  fields: [],
  svgRaw: "",

  setFields: (fields) => {
    const initializedFields = fields.map((field) => ({
      ...field,
      currentValue: field.defaultValue ?? "",
    }));

    set(() => ({
      fields: initializedFields,
    }));
  },

  updateField: (fieldId, value) => {
    set((state) => {
      const updatedFields = state.fields.map((field) =>
        field.id === fieldId ? { ...field, currentValue: value } : field
      );

      return {
        fields: updatedFields,
      };
    });
  },

  uploadFile: (fieldId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      set((state) => {
        const updatedFields = state.fields.map((field) =>
          field.id === fieldId ? { ...field, currentValue: dataUrl } : field
        );

        return {
          fields: updatedFields,
        };
      });
    };
    reader.readAsDataURL(file);
  },

  resetForm: () => {
    set((state) => ({
      fields: state.fields.map((field) => ({
        ...field,
        currentValue: field.defaultValue ?? "",
      })),
    }));
  },

  getFieldValue: (fieldId) => {
    return get().fields.find((f) => f.id === fieldId)?.currentValue;
  },

  setSvgRaw: (svg) => set({ svgRaw: svg }),

  downloadSvg: (fileName = "form-output.svg") => {
    const { svgRaw, fields } = get();

    const updatedSvg = updateSvgFromFields(svgRaw, fields);
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

export default useFormStore;
