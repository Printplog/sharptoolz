import React, { useEffect, useState, useRef } from "react";
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
import ImageCropUpload from "@/components/ui/ImageCropUpload";
import SignatureField from "@/components/ui/SignatureField";
import CustomDateTimePicker from "@/components/ui/CustomDateTimePicker";
import { generateValue, applyMaxGeneration } from "@/lib/utils/fieldGenerator";

const FormFieldComponent: React.FC<{ field: FormField; allFields?: FormField[]; isPurchased?: boolean; tutorial?: Tutorial }> = ({ field, allFields = [], isPurchased = false, tutorial }) => {
  const { updateField } = useToolStore();
  const value = field.currentValue;
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  // Track raw date value for date inputs (YYYY-MM-DD format)
  const [rawDateValue, setRawDateValue] = useState<string>(() => {
    if (field.type === 'date' && typeof value === 'string') {
      // If value is already in YYYY-MM-DD format, use it
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return value;
      }
      // Otherwise, try to parse it or use today's date
      try {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
      } catch (e) {
        // ignore
      }
    }
    return new Date().toISOString().split('T')[0];
  });
  

  // Generate value based on generation rule or fallback to simple random
  const generateFieldValue = () => {
    // Build field map for cross-field generation
    const fieldMap: Record<string, string | number | boolean> = {};
    allFields.forEach(f => {
      fieldMap[f.id] = f.currentValue || '';
    });
    
    // If generationRule exists, use comprehensive generation
    if (field.generationRule) {
      let generated = generateValue(field.generationRule, fieldMap);
      
      // Apply max generation padding if specified
      if (field.maxGeneration) {
        generated = applyMaxGeneration(generated, field.maxGeneration);
      }
      
      return generated;
    }
    
    // Fallback to simple alphanumeric generation (old behavior)
    const length = field.max || 8;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Auto-generate value for "gen" type fields when they're first loaded
  useEffect(() => {
    if (field.type === "gen" && !value && !isPurchased) {
      const generatedValue = generateFieldValue();
      updateField(field.id, generatedValue);
    }
  }, [field.type, field.id, value, updateField, isPurchased]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Check if this is the Error_Message field and if Status is "Error Message"
  const shouldShowErrorMessage = () => {
    if (field.id === "Error_Message") {
      const statusField = allFields.find(f => f.id === "Status");
      const statusValue = statusField?.currentValue || statusField?.defaultValue;
      
      // Find the selected option to get its label
      const selectedOption = statusField?.options?.find(opt => opt.value === statusValue);
      const label = selectedOption?.label;
      
      return label === "Error";
    }
    return true; // Show all other fields normally
  };
  
  // Don't render if this is Error_Message and Status is not "Error Message"
  if (!shouldShowErrorMessage()) {
    return null;
  }

  // Determine if field should be disabled
  // Field is disabled if:
  // 1. Document is purchased AND
  // 2. Field is not explicitly marked as editable
  const isFieldDisabled = isPurchased && !field.editable;

  const handleChange = (newValue: string | number | boolean) => {
    if (!isFieldDisabled) {
      updateField(field.id, newValue);
    }
  };

  // If field has options, render as select
  // if (field.options && field.options.length > 0) {
  //   return (
      
  //   );
  // }

  // Render based on field type
  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "url":
    case "password":
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
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
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
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={field.max}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[80px]"
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
        <Select defaultValue={value as string} value={value as string} onValueChange={handleChange} disabled={isFieldDisabled}>
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
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.id}
            checked={value as boolean}
            onCheckedChange={handleChange}
            className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
            disabled={isFieldDisabled}
          />
          <label htmlFor={field.id} className="text-sm font-medium text-white flex items-center">
            {field.name}
            {field.helperText && (
              <FieldHelper 
                fieldName={field.name}
                helperText={field.helperText} 
                tutorialUrl={tutorial?.url}
              />
            )}
          </label>
        </div>
      );
      
    case "hide":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.id}
            checked={value as boolean}
            onCheckedChange={handleChange}
            className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
            disabled={isFieldDisabled}
          />
          <label htmlFor={field.id} className="text-sm font-medium text-white">
            {`${field.name}`}
          </label>
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
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
            onImageSelect={(fieldId: string, croppedImageDataUrl: string) => {
              updateField(fieldId, croppedImageDataUrl);
            }}
            svgElementId={field.svgElementId}
            disabled={isFieldDisabled}
            requiresGrayscale={field.requiresGrayscale}
            grayscaleIntensity={field.grayscaleIntensity}
          />
        </div>
      );

    case "sign": {
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
              value={(value as string) || generateFieldValue()}
              readOnly
              className="bg-white/5 border-white/20 text-gray-400 cursor-not-allowed"
              disabled={isFieldDisabled}
            />
            <Button
              type="button"
              onClick={() => handleChange(generateFieldValue())}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={isFieldDisabled}
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
};

export default FormFieldComponent;