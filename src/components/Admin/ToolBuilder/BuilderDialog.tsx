import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { addTemplate } from "@/api/apiEndpoints";
import type { Template } from "@/types";
import { useNavigate } from "react-router-dom";
import { useDialogStore } from "@/store/dialogStore";

// ------------------------
// Validation Schema
// ------------------------
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function BuilderDialog() {
  const [file, setFile] = useState<File | null>(null);
  const { closeDialog } = useDialogStore()

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/svg+xml": [".svg"],
    },
    maxFiles: 1,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Partial<Template>) => addTemplate(data),
    onSuccess() {
      closeDialog("toolBuilder")
      navigate("/admin/tools")
    },
  })

  const onSubmit = (values: FormValues) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target?.result as string;
      mutate({
      name: values.name,
      svg: svgText,
      type: "tool"
      });
    };
    reader.readAsText(file);
  };


  return (
    <CustomDialog dialogName="toolBuilder">
      <DialogContent className="bg-gray-900 border-white/20 text-white max-w-3xl w-full p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Tool Builder</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 pt-0 space-y-6">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., National ID Card"
                        className="bg-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SVG Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-white/20 hover:border-white/40"
                  }
                `}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <span>📄 {file.name}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-white/70 mb-2">
                      {isDragActive
                        ? "Drop your SVG here"
                        : "Drag & drop an SVG file here, or click to select"}
                    </p>
                    <p className="text-xs text-white/50">
                      Only SVG files are supported
                    </p>
                  </>
                )}
              </div>

              {/* SVG Preview */}
              {file && (
                <div className="mt-2">
                  <object
                    data={URL.createObjectURL(file)}
                    type="image/svg+xml"
                    className="w-full h-40 max-h-60 border border-white/10 rounded-md p-2 bg-white/5"
                  >
                    <img
                      src="/fallback.png"
                      alt="SVG Preview"
                      className="w-full h-full object-contain"
                    />
                  </object>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="text-sm font-medium"
                  disabled={ isPending || !form.formState.isDirty }
                >
                  { isPending ? "Building..." : "Build Tool"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </CustomDialog>
  );
}
