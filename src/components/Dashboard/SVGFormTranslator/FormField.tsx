import React, { useEffect } from "react";
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
import useToolStore from "@/store/formStore";
import type { FormField } from "@/types";
import { Textarea } from "@/components/ui/textarea";

const FormFieldComponent: React.FC<{ field: FormField }> = ({ field }) => {
  const { updateField, uploadFile, status, setStatus, setStatusMessage, statusMessage } = useToolStore();
  const value = field.currentValue || "";

  useEffect(() => {
    setStatus("")
    setStatusMessage("")
  }, [setStatus, setStatusMessage])

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
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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

    case "status":
      return (
        <div className="space-y-2 w-full">
          <label htmlFor={field.id} className="text-sm font-medium text-white">
            {field.name}
          </label>
          <Select value={status} onValueChange={(e) => setStatus(e)}>
            <SelectTrigger className="bg-white/10 border-white/20 w-full text-white data-[placeholder]:text-white/80">
              <SelectValue placeholder={`--Select ${field.name}--`} className="text-white placeholder:text-white " />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-white/20">
              {[
                "Processing",
                "In Transit",
                "Delivered",
                "Error Message",
              ].map((item) => (
                <SelectItem
                  key={item}
                  value={item.replace(" ", "_").toLowerCase()}
                  className="text-white hover:bg-white/10"
                >
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {status === "error_message" && (
            <div className="mt-4 space-y-2">
              <label htmlFor="error">
                Error Message
              </label>
              <Textarea id="error" value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)}  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[80px]" />
            </div>
          )}
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
            className="bg-white/10 border-white/20 text-white w-full"
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

export default FormFieldComponent;