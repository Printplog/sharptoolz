// store/useFormStore.ts
import { create } from "zustand";
import type { FormField } from "@/types";
import updateSvgFromFields from "@/lib/utils/updateSvgFromFormData";

interface ToolStore {
  name: string;
  fields: FormField[];
  svgRaw: string;
  status: string;
  statusMessage: string;

  setName: (name: string) => void;
  setFields: (fields: FormField[]) => void;
  updateField: (fieldId: string, value: string | number | boolean) => void;
  uploadFile: (fieldId: string, file: File) => void;
  resetForm: () => void;
  getFieldValue: (fieldId: string) => string | number | boolean | undefined;
  setSvgRaw: (svg: string) => void;
  downloadSvg: (fileName?: string) => void;

  setStatus: (status: string) => void;
  setStatusMessage: (message: string) => void;
  setStatusWithMessage: (status: string, message: string) => void;
}

const  useToolStore = create<ToolStore>((set, get) => ({
  name: "",
  fields: [] as FormField[],
  svgRaw: "",
  status: "",
  statusMessage: "",

  setName: (name) => set({ name }),

  setFields: (fields) => {
    const initializedFields = fields?.map((field) => ({
      ...field,
      currentValue: field.defaultValue ?? "",
    }));

    set({ fields: initializedFields });
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

  setStatus: (status) => set({ status }),
  setStatusMessage: (message) => set({ statusMessage: message }),
  setStatusWithMessage: (status, message) =>
    set({ status, statusMessage: message }),
}));


export default useToolStore;