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
  updateField: (fieldId: string, value: string | number | boolean | null, updates?: Partial<FormField>) => void;
  notifyDependents: (sourceFieldId: string, value: string | number | boolean) => void;
  uploadFile: (fieldId: string, file: File) => void;
  resetForm: () => void;
  markFieldsSaved: (fieldIds?: string[]) => void;
  getFieldValue: (fieldId: string) => string | number | boolean | null | undefined;
  setSvgRaw: (svg: string) => void;
  downloadSvg: (fileName?: string) => void;
}

const  useToolStore = create<ToolStore>((set, get) => ({
  name: "",
  fields: [] as FormField[],
  svgRaw: "",

  setName: (name) => set({ name }),

  setFields: (fields, isPurchased) => {
    if (!fields) {
      set({ fields: [] });
      return;
    }

    if (isPurchased) {
      const fieldsWithValues = fields.map((field) => {
        const hasOptions = field.options && field.options.length > 0;
        const currentValue =
          field.currentValue ??
          (hasOptions ? field.defaultValue ?? "" : field.currentValue ?? field.defaultValue ?? "");

        return {
          ...field,
          currentValue,
          touched: false,
        };
      });
      set({ fields: fieldsWithValues });
    } else {
      const initializedFields = fields.map((field) => ({
        ...field,
        currentValue: field.defaultValue ?? "",
        touched: false,
      }));
      set({ fields: initializedFields });
    }
  },

  updateField: (fieldId, value, updates) => {
    set((state) => {
      // Optimize: Only create new array if the value actually changed
      const field = state.fields?.find(f => f.id === fieldId);
      
      // Check if value changed OR if there are updates that differ
      let hasChanges = false;
      if (field?.currentValue !== value) hasChanges = true;
      if (updates && field) {
        for (const [key, val] of Object.entries(updates)) {
          if (field[key as keyof FormField] !== val) {
            hasChanges = true;
            break;
          }
        }
      }
      
      if (field && !hasChanges) {
        // Nothing changed, skip update to prevent unnecessary re-renders
        return state;
      }
      
      // Use shallow copy optimization - only create new objects for changed field
      const newFields = state.fields?.map((field) => {
        if (field.id === fieldId) {
          return { ...field, currentValue: value, touched: true, ...(updates || {}) };
        }
        return field; // Return same reference for unchanged fields
      });
      
      return {
        fields: newFields,
      };
    });
  },

  notifyDependents: (sourceFieldId, value) => {
    set((state) => {
      const newFields = state.fields?.map((field) => {
        // Check if this field depends on the source field
        if (field.dependsOn) {
          const baseDependsOn = field.dependsOn.split('[')[0];
          if (baseDependsOn === sourceFieldId) {
            return { ...field, currentValue: value, touched: true };
          }
        }
        return field;
      });
      return { fields: newFields };
    });
  },

  uploadFile: (fieldId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      set((state) => ({
        fields: state.fields?.map((field) =>
          field.id === fieldId ? { ...field, currentValue: dataUrl, touched: true } : field
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
        touched: false,
      })),
    }));
  },

  markFieldsSaved: (fieldIds) => {
    set((state) => ({
      fields: state.fields?.map((field) => {
        if (fieldIds && fieldIds.length > 0 && !fieldIds.includes(field.id)) {
          return field;
        }
        return {
          ...field,
          touched: false,
        };
      }),
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