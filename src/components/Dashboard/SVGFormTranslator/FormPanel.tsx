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
import { Upload, RotateCcw } from "lucide-react";
import useFormStore from "@/store/formStore";
import type { FormField } from "@/types";
import { Textarea } from "@/components/ui/textarea";

const FormFieldComponent: React.FC<{ field: FormField }> = ({ field }) => {
  const { updateField, uploadFile } = useFormStore();
  const value = field.currentValue || "";

  const handleChange = (newValue: string | number | boolean) => {
    updateField(field.id, newValue);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(field.id, file);
    }
  };

  const generateId = (length: number) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < (length || 8); i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // If field has options, render as select
  if (field.options && field.options.length > 0) {
    return (
      <div className="space-y-2 w-full">
        <label htmlFor={field.id} className="text-sm font-medium text-white">
          {field.name}
        </label>
        <Select value={value as string} onValueChange={handleChange}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white w-full">
            <SelectValue placeholder={`Select ${field.name}`} />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-white/20">
            {field.options.map((option) => (
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
  }

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
          />
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
          />
          <label htmlFor={field.id} className="text-sm font-medium text-white">
            {field.name}
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
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
      );

    case "upload":
    case "file":
      return (
        <div className="space-y-2 w-full">
          <label htmlFor={field.id} className="text-sm font-medium text-white">
            {field.name}
          </label>
          <div className="relative">
            <Input
              id={field.id}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(field.id)?.click()}
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Upload className="w-4 h-4 mr-2" />
              {value ? `${field.name} uploaded` : `Upload ${field.name}`}
            </Button>
          </div>
        </div>
      );

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
            />
            <Button
              type="button"
              onClick={() => handleChange(generateId(field.max as number))}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
          />
        </div>
      );

    default:
      return null;
  }
};

export default function FormPanel() {
  const { fields, resetForm, downloadSvg } = useFormStore();

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Form Fields</h2>
        <Button
          onClick={resetForm}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <FormFieldComponent key={field.id} field={field} />
        ))}
      </div>

      <div className="pt-4 border-t border-white/20">
        <Button onClick={() => downloadSvg("Urkelcodes_is_good hahahha")} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Generate Document
        </Button>
      </div>
    </div>
  );
}
