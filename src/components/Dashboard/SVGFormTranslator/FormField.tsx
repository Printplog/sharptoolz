import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw, Calendar } from "lucide-react";
import useToolStore from "@/store/formStore";
import type { FormField, Tutorial } from "@/types";
import FieldHelper from "./FieldHelper";

// Extended FormField type for signature fields
interface ExtendedFormField extends FormField {
  signatureWidth?: number;
  signatureHeight?: number;
  signatureBackground?: string;
  signaturePenColor?: string;
}
import { Textarea } from "@/components/ui/textarea";

import ImageCropUpload from "@/components/ui/ImageCropUpload.tsx";
import SignatureField from "@/components/ui/SignatureField";
import CustomDateTimePicker from "@/components/ui/CustomDateTimePicker";
import { generateValue, applyMaxGeneration } from "@/lib/utils/fieldGenerator";
import { extractFromDependency } from "@/lib/utils/fieldExtractor";

const FormFieldComponent: React.FC<{
  field: FormField;
  allFields?: FormField[];
  isPurchased?: boolean;
  tutorial?: Tutorial;
}> = React.memo(
  ({ field, allFields = [], isPurchased = false, tutorial }) => {
    // 1. Hooks MUST be at the top level
    const updateField = useToolStore((state) => state.updateField);
    const notifyDependents = useToolStore((state) => state.notifyDependents);
    const storeFields = useToolStore((state) => state.fields);

    // Get latest value from store if available, otherwise use field prop
    const fieldFromStore = storeFields.find(f => f.id === field.id);
    const value = fieldFromStore?.currentValue ?? field.currentValue;

    // Use storeFields if available, otherwise fall back to allFields prop
    const fieldsForDependencies = storeFields.length > 0 ? storeFields : allFields;
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Track raw date value for date inputs (YYYY-MM-DD format)
    const [rawDateValue, setRawDateValue] = useState<string>(() => {
      if (field.type === "date" && typeof value === "string") {
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return value;
        }
        try {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split("T")[0];
          }
        } catch {
          // ignore
        }
      }
      return new Date().toISOString().split("T")[0];
    });

    // Generate value based on generation rule or fallback to simple random
    const generateFieldValue = useCallback(() => {
      const fieldMap: Record<string, string | number | boolean> = {};
      allFields.forEach((f) => {
        fieldMap[f.id] = f.currentValue || "";
      });

      if (field.generationRule) {
        const maxLength = field.max || undefined;
        let generated = generateValue(field.generationRule, fieldMap, maxLength);

        if (field.maxGeneration) {
          generated = applyMaxGeneration(generated, field.maxGeneration);
        }

        return generated;
      }

      const length = field.max || 8;
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }, [field.generationRule, field.max, field.maxGeneration, allFields]);

    const dependencies = useMemo(() => {
      const deps = new Set<string>();

      if (field.generationRule) {
        const depMatches = field.generationRule.match(/dep_(\w+)/g) || [];
        depMatches.forEach((match) => {
          const fieldName = match.replace("dep_", "").split("[")[0];
          deps.add(fieldName);
        });
      }

      if (field.dependsOn) {
        deps.add(field.dependsOn.split("[")[0]);
      }

      return Array.from(deps);
    }, [field.generationRule, field.dependsOn]);

    const dependsOnFieldId = useMemo(() => {
      if (!field.dependsOn) return null;
      return field.dependsOn.split("[")[0];
    }, [field.dependsOn]);

    const dependencyValuesString = useMemo(() => {
      return dependencies
        .map((depId) => {
          const depField = fieldsForDependencies.find((f) => f.id === depId);
          return depField
            ? String(depField.currentValue || depField.defaultValue || "")
            : "";
        })
        .join("|");
    }, [dependencies, fieldsForDependencies]);

    const dependsOnValue = useMemo(() => {
      if (!dependsOnFieldId) return null;
      const depField = fieldsForDependencies.find(
        (f) => f.id === dependsOnFieldId
      );
      if (!depField) return null;
      return depField.currentValue ?? depField.defaultValue ?? null;
    }, [dependsOnFieldId, fieldsForDependencies]);

    const dependsOnValueHash = useMemo(() => {
      if (!dependsOnValue) return "";
      if (
        typeof dependsOnValue === "string" &&
        (dependsOnValue.startsWith("data:image/") ||
          dependsOnValue.startsWith("blob:"))
      ) {
        const str = dependsOnValue;
        return str.length > 150
          ? `${str.substring(0, 100)}...${str.substring(str.length - 50)}`
          : str;
      }
      return String(dependsOnValue);
    }, [dependsOnValue]);

    useEffect(() => {
      const hasGeneration = field.type === "gen" || !!field.generationRule;
      if (!hasGeneration || isPurchased) return;

      const isAutoMode = field.generationMode === "auto" || field.isTrackingId;

      if (isAutoMode && !value) {
        updateField(field.id, generateFieldValue());
        return;
      }

      if (isAutoMode && dependencies.length > 0) {
        updateField(field.id, generateFieldValue());
      }
    }, [
      field.type,
      field.id,
      field.generationRule,
      field.generationMode,
      field.isTrackingId,
      value,
      updateField,
      isPurchased,
      dependencies.length,
      dependencyValuesString,
      generateFieldValue,
    ]);

    useEffect(() => {
      if (field.generationRule || !field.dependsOn || isPurchased) return;

      const isImageField =
        field.type === "upload" || field.type === "file" || field.type === "sign";
      if (isImageField) return;

      const allFieldValues: Record<string, string | number | boolean | unknown> = {};
      fieldsForDependencies.forEach((f) => {
        if (f.type === "select" && f.options && f.options.length > 0) {
          const selected = f.options.find(
            (opt) => String(opt.value) === String(f.currentValue)
          );
          allFieldValues[f.id] =
            selected?.displayText ?? selected?.label ?? f.currentValue ?? "";
        } else {
          allFieldValues[f.id] = f.currentValue ?? "";
        }
      });

      const extractedValue = extractFromDependency(field.dependsOn, allFieldValues);

      if (extractedValue !== value && extractedValue !== "") {
        updateField(field.id, extractedValue);
      }
    }, [
      field.id,
      field.type,
      field.dependsOn,
      field.generationRule,
      dependsOnValueHash,
      updateField,
      isPurchased,
      fieldsForDependencies,
      value,
    ]);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isTextInput = ["text", "email", "tel", "url", "password", "textarea"].includes(
      field.type
    );
    const [localValue, setLocalValue] = useState<string>(() =>
      String(value ?? "")
    );

    useEffect(() => {
      if (isTextInput) {
        setLocalValue(String(value ?? ""));
      }
    }, [value, isTextInput]);

    const isFieldDisabled = isPurchased && !field.editable;

    const handleChange = useCallback(
      (newValue: string | number | boolean) => {
        if (isFieldDisabled) return;

        if (isTextInput) {
          setLocalValue(String(newValue));
        }

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          updateField(field.id, newValue);
        }, 300);
      },
      [field.id, updateField, isFieldDisabled, isTextInput]
    );

    const handleBlur = useCallback(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (isTextInput && !isFieldDisabled) {
        updateField(field.id, localValue);
      }
    }, [field.id, localValue, updateField, isFieldDisabled, isTextInput]);

    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // 2. Conditional check for visibility based on show_if modifier
    const shouldShowField = useCallback(() => {
      if (!field.showIf) return true;
      const target = fieldsForDependencies.find((f) => f.id === field.showIf!.fieldId);
      const rawValue = String(target?.currentValue ?? target?.defaultValue ?? "");
      const labelValue = target?.options?.find((o) => o.value === rawValue)?.label ?? "";
      const expected = field.showIf.value;
      return rawValue.toLowerCase() === expected.toLowerCase() ||
             labelValue.toLowerCase() === expected.toLowerCase();
    }, [field.showIf, fieldsForDependencies]);

    // 3. Early return after all hooks
    if (!shouldShowField()) {
      return null;
    }

    // If field has options, render as select
    // if (field.options && field.options.length > 0) {
    //   return (

    //   );
    // }

    // Render based on field type
    // If field has generationRule, treat it as gen field (even if type is "text")
    const hasGenerationRule = !!field.generationRule;
    const effectiveType = hasGenerationRule ? "gen" : field.type;

    switch (effectiveType) {
      case "text":
      case "email":
      case "tel":
      case "url":
      case "password":
        // If this field has generationRule but type is text, show generation button
        if (hasGenerationRule) {
          return (
            <div className="space-y-2 w-full">
              <label htmlFor={field.id} className="text-sm font-medium text-white">
                {field.name}
                {field.helperText && (
                  <FieldHelper
                    fieldName={field.name}
                    helperText={field.helperText}
                    tutorialUrl={tutorial?.url}
                  />
                )}
              </label>
              <div className="flex gap-2">
                <Input
                  id={field.id}
                  type="text"
                  value={(value as string) || ""}
                  readOnly
                  className="bg-white/5 border-white/20 text-gray-400 cursor-not-allowed"
                  disabled={isFieldDisabled}
                  placeholder="Click regenerate to generate value"
                />
                <Button
                  type="button"
                  onClick={() => handleChange(generateFieldValue())}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full"
                  disabled={isFieldDisabled}
                  title="Regenerate value"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-2 flex flex-col">
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.name}
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
              {field.max && (
                <span className="text-gray-400 ml-1">(max {field.max})</span>
              )}
            </label>
            <Input
              id={field.id}
              type={field.type}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              maxLength={field.max}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
              placeholder={`Enter ${field.name}`}
              disabled={isFieldDisabled}
            />
          </div>
        );

      case "number":
      case "range":
        return (
          <div className="space-y-2 w-full">
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.name}
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
              {field.max && (
                <span className="text-gray-400 ml-1">(max {field.max})</span>
              )}
            </label>
            <Input
              id={field.id}
              type={field.type}
              value={value as number}
              onChange={(e) => handleChange(Number(e.target.value))}
              max={field.max}
              className="bg-white/10 border-white/20 text-white"
              disabled={isFieldDisabled}
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2 w-full">
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.name}
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
              {field.max && (
                <span className="text-gray-400 ml-1">(max {field.max})</span>
              )}
            </label>
            <Textarea
              id={field.id}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              maxLength={field.max}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 min-h-[80px]"
              placeholder={`Enter ${field.name}`}
              disabled={isFieldDisabled}
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-2 w-full">
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.name}
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
            </label>
            <Select 
              value={value !== undefined && value !== null ? String(value) : ""} 
              onValueChange={handleChange} 
              disabled={isFieldDisabled}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white w-full">
                <SelectValue placeholder={`Select ${field.name}`} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20 z-[999999]">
                {field?.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-white/10"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );


      case "checkbox":
        return (
          <div
            onClick={() => !isFieldDisabled && handleChange(!value)}
            className={cn(
              "flex items-center justify-between px-6 py-4 rounded-full border border-white/10",
              "bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group",
              isFieldDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
              {field.name}
            </span>
            <div className="flex items-center gap-3">
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
              <Checkbox
                id={field.id}
                checked={value as boolean}
                onCheckedChange={handleChange}
                className="size-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                onClick={(e) => e.stopPropagation()}
                disabled={isFieldDisabled}
              />
            </div>
          </div>
        );

      case "hide":
        return (
          <div
            onClick={() => !isFieldDisabled && handleChange(!value)}
            className={cn(
              "flex items-center justify-between px-6 py-4 rounded-full border border-white/10",
              "bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group",
              isFieldDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
              {field.name}
            </span>
            <Checkbox
              id={field.id}
              checked={value as boolean}
              onCheckedChange={handleChange}
              className="size-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
              onClick={(e) => e.stopPropagation()}
              disabled={isFieldDisabled}
            />
          </div>
        );

      case "date":
        return (
          <div className="space-y-2 w-full">
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.name}
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
            </label>
            {field.dateFormat ? (
              <CustomDateTimePicker
                value={value as string}
                onChange={handleChange}
                format={field.dateFormat}
                disabled={isFieldDisabled}
              />
            ) : (
              <div className="relative">
                {/* Hidden native date picker */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={rawDateValue}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setRawDateValue(selectedDate);
                    handleChange(selectedDate);
                  }}
                  className="absolute opacity-0 pointer-events-none"
                  disabled={isFieldDisabled}
                />

                {/* Visible formatted display */}
                <div className="flex gap-2">
                  <Input
                    id={field.id}
                    type="text"
                    value={(value as string) || ''}
                    readOnly
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="bg-white/10 border-white/20 text-white w-full cursor-pointer"
                    disabled={isFieldDisabled}
                  />
                  <Button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full"
                    disabled={isFieldDisabled}
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case "upload":
      case "file":
        // Hide upload fields that have dependencies (they're auto-populated)
        if (field.dependsOn) {
          return null;
        }
        return (
          <div className="space-y-2 w-full">
            {field.helperText && (
              <label className="text-sm font-medium text-white">
                {field.name}
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              </label>
            )}
            <ImageCropUpload
              fieldId={field.id}
              fieldName={field.helperText ? "" : field.name}
              currentValue={value as string}
              onImageSelect={(fieldId: string, croppedImageDataUrl: string, rotation?: number) => {
                updateField(fieldId, croppedImageDataUrl, typeof rotation !== 'undefined' ? { rotation } : undefined);
                // Notify dependent fields when an image changes
                notifyDependents(fieldId, croppedImageDataUrl);
              }}
              svgElementId={field.svgElementId}
              disabled={isFieldDisabled}
              requiresGrayscale={field.requiresGrayscale}
              grayscaleIntensity={field.grayscaleIntensity}
              targetAspectRatio={field.aspectRatio}
            />
          </div>
        );

      case "sign": {
        // Hide sign fields that have dependencies (they're auto-populated)
        if (field.dependsOn) {
          return null;
        }
        const signatureField = field as ExtendedFormField;
        return (
          <div className="space-y-2 w-full">
            {field.helperText && (
              <label className="text-sm font-medium text-white">
                {field.name}
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              </label>
            )}
            <SignatureField
              fieldId={field.id}
              fieldName={field.helperText ? "" : field.name}
              currentValue={value as string}
              onSignatureSelect={(fieldId: string, signatureDataUrl: string) => {
                updateField(fieldId, signatureDataUrl);
                // Notify dependent fields when a signature changes
                notifyDependents(fieldId, signatureDataUrl);
              }}
              width={signatureField.signatureWidth || 400}
              height={signatureField.signatureHeight || 150}
              backgroundColor={signatureField.signatureBackground || '#ffffff'}
              penColor={signatureField.signaturePenColor || '#000000'}
              svgElementId={field.svgElementId}
              disabled={isFieldDisabled}
            />
          </div>
        );
      }

      case "gen":
        return (
          <div className="space-y-2 w-full">
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.name}
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
            </label>
            <div className="flex gap-2">
              <Input
                id={field.id}
                type="text"
                value={(value as string) || ""}
                readOnly
                className="bg-white/5 border-white/20 text-gray-400 cursor-not-allowed"
                disabled={isFieldDisabled}
                placeholder="Click regenerate to generate value"
              />
              <Button
                type="button"
                onClick={() => handleChange(generateFieldValue())}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full"
                disabled={isFieldDisabled}
                title="Regenerate value"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case "color":
        return (
          <div className="space-y-2 w-full">
            <label htmlFor={field.id} className="text-sm font-medium text-white">
              {field.name}
              {field.helperText && (
                <FieldHelper
                  fieldName={field.name}
                  helperText={field.helperText}
                  tutorialUrl={tutorial?.url}
                />
              )}
            </label>
            <Input
              id={field.id}
              type="color"
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              className="bg-white/10 border-white/20 h-10 w-full"
              disabled={isFieldDisabled}
            />
          </div>
        );

      default:
        return null;
    }
  }, (prevProps, nextProps) => {
    // Return true to skip re-render if nothing relevant changed
    const fieldChanged =
      prevProps.field.id !== nextProps.field.id ||
      prevProps.field.currentValue !== nextProps.field.currentValue ||
      prevProps.field.touched !== nextProps.field.touched ||
      prevProps.isPurchased !== nextProps.isPurchased;

    if (fieldChanged) return false;

    // If this field has a show_if condition, re-render when the target field's value changes
    if (nextProps.field.showIf) {
      const targetId = nextProps.field.showIf.fieldId;
      const prevTarget = prevProps.allFields?.find(f => f.id === targetId);
      const nextTarget = nextProps.allFields?.find(f => f.id === targetId);
      if (prevTarget?.currentValue !== nextTarget?.currentValue) return false;
    }

    return true;
  });

FormFieldComponent.displayName = 'FormFieldComponent';

export default FormFieldComponent;