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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTemplate } from "@/api/apiEndpoints";
import { useNavigate } from "react-router-dom";
import { useDialogStore } from "@/store/dialogStore";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { useEffect } from "react";

// ------------------------
// Validation Schema
// ------------------------
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  svgFile: z.instanceof(File, { message: "SVG file is required" }),
  bannerFile: z.instanceof(File, { message: "Banner image is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function BuilderDialog() {
  const { closeDialog, dialogs } = useDialogStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (dialogs.toolBuilder) {
      form.reset();
    }
  }, [dialogs.toolBuilder, form]);

  // SVG Dropzone
  const onSvgDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      form.setValue("svgFile", acceptedFiles[0]);
    }
  };

  const {
    getRootProps: getSvgRootProps,
    getInputProps: getSvgInputProps,
    isDragActive: isSvgDragActive,
  } = useDropzone({
    onDrop: onSvgDrop,
    accept: {
      "image/svg+xml": [".svg"],
    },
    maxFiles: 1,
  });

  // Banner Dropzone
  const onBannerDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      form.setValue("bannerFile", acceptedFiles[0]);
    }
  };

  const {
    getRootProps: getBannerRootProps,
    getInputProps: getBannerInputProps,
    isDragActive: isBannerDragActive,
  } = useDropzone({
    onDrop: onBannerDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => addTemplate(data),
    onSuccess() {
      
      closeDialog("toolBuilder");
      navigate("/admin/tools");
      toast.success("Tool created successfully");
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
    onError(error: Error) {
      toast.error(errorMessage(error));
      console.error("Error adding template:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      // Read SVG file
      const svgText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(values.svgFile);
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('svg', svgText);
      formData.append('banner', values.bannerFile); // Send the actual file
      formData.append('type', 'tool');

      mutate(formData);
    } catch (error) {
      console.error("Error processing files:", error);
    }
  };

  const svgFile = form.watch("svgFile");
  const bannerFile = form.watch("bannerFile");

  return (
    <CustomDialog dialogName="toolBuilder">
      <DialogContent className="bg-gray-900 border-white/20 text-white max-w-3xl w-full p-0 max-h-[90vh] flex flex-col overflow-hidden overflow-y-auto custom-scrollbar">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl">Tool Builder</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="p-6 pt-0 space-y-6 flex-1 overflow-y-auto">
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
              <FormField
                control={form.control}
                name="svgFile"
                render={() => (
                  <FormItem>
                    <FormLabel>SVG Template</FormLabel>
                    <FormControl>
                      <div
                        {...getSvgRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                          ${
                            isSvgDragActive
                              ? "border-primary bg-primary/5"
                              : "border-white/20 hover:border-white/40"
                          }
                        `}
                      >
                        <input {...getSvgInputProps()} />
                        {svgFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <span>📄 {svgFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-white/70 mb-2">
                              {isSvgDragActive
                                ? "Drop your SVG here"
                                : "Drag & drop an SVG file here, or click to select"}
                            </p>
                            <p className="text-xs text-white/50">
                              Only SVG files are supported
                            </p>
                          </>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SVG Preview */}
              {svgFile && (
                <div className="mt-2">
                  <object
                    data={URL.createObjectURL(svgFile)}
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

              {/* Banner Dropzone */}
              <FormField
                control={form.control}
                name="bannerFile"
                render={() => (
                  <FormItem>
                    <FormLabel>Banner Image</FormLabel>
                    <FormControl>
                      <div
                        {...getBannerRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                          ${
                            isBannerDragActive
                              ? "border-primary bg-primary/5"
                              : "border-white/20 hover:border-white/40"
                          }
                        `}
                      >
                        <input {...getBannerInputProps()} />
                        {bannerFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <span>🖼️ {bannerFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-white/70 mb-2">
                              {isBannerDragActive
                                ? "Drop your banner image here"
                                : "Drag & drop a banner image here, or click to select"}
                            </p>
                            <p className="text-xs text-white/50">
                              PNG, JPG, JPEG, GIF, WebP supported
                            </p>
                          </>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banner Preview */}
              {bannerFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(bannerFile)}
                    alt="Banner Preview"
                    className="w-full h-40 max-h-60 border border-white/10 rounded-md p-2 bg-white/5 object-contain"
                  />
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end flex-shrink-0">
                <Button
                  type="submit"
                  className="text-sm font-medium"
                  disabled={isPending || !form.formState.isDirty}
                >
                  {isPending ? "Building..." : "Build Tool"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </CustomDialog>
  );
}
