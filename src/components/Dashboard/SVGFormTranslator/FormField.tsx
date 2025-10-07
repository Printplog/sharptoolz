import React from "react";
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
import { RotateCcw } from "lucide-react";
import useToolStore from "@/store/formStore";
import type { FormField } from "@/types";

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

const FormFieldComponent: React.FC<{ field: FormField; allFields?: FormField[]; isPurchased?: boolean }> = ({ field, allFields = [], isPurchased = false }) => {
  const { updateField } = useToolStore();
  const value = field.currentValue;
  
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
      console.log(newValue)
    }
  };

  const generateId = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < (length || 8); i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
        </label>
        <Select defaultValue={value as string} value={value as string} onValueChange={handleChange} disabled={isFieldDisabled}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white w-full">
            <SelectValue placeholder={`Select ${field.name}`} />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-white/20">
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
          <label htmlFor={field.id} className="text-sm font-medium text-white">
            {field.name}
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
          </label>
          <Input
            id={field.id}
            type="date"
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white w-full"
            disabled={isFieldDisabled}
          />
        </div>
      );

    case "upload":
    case "file":
      return (
        <ImageCropUpload
          fieldId={field.id}
          fieldName={field.name}
          currentValue={value as string}
          onImageSelect={(fieldId: string, croppedImageDataUrl: string) => {
            updateField(fieldId, croppedImageDataUrl);
          }}
          svgElementId={field.svgElementId}
          disabled={isFieldDisabled}
        />
      );

    case "sign": {
      const signatureField = field as ExtendedFormField;
      return (
        <SignatureField
          fieldId={field.id}
          fieldName={field.name}
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
      );
    }

    case "gen":
      return (
        <div className="space-y-2 w-full">
          <label htmlFor={field.id} className="text-sm font-medium text-white">
            {field.name}
          </label>
          <div className="flex gap-2">
            <Input
              id={field.id}
              type="text"
              value={(value as string) || generateId(field.max as number)}
              readOnly
              className="bg-white/5 border-white/20 text-gray-400 cursor-not-allowed"
              disabled={isFieldDisabled}
            />
            <Button
              type="button"
              onClick={() => handleChange(generateId(field.max as number))}
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