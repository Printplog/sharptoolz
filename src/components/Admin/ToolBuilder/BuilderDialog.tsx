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
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addTemplate, getTools, getFonts, addFont } from "@/api/apiEndpoints";
import { useLocation } from "react-router-dom";
import { useDialogStore } from "@/store/dialogStore";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { useEffect } from "react";
import type { Tool, Font } from "@/types";
import { LazyImage } from "@/components/LazyImage";

// ------------------------
// Validation Schema
// ------------------------
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  svgFile: z.instanceof(File, { message: "SVG file is required" }).optional(),
  bannerFile: z.instanceof(File, { message: "Banner image is required" }).optional(),
  tool: z.string().optional(),
  tutorialUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tutorialTitle: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  fontIds: z.array(z.string()).optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BuilderDialog() {
  const { closeDialog, dialogs } = useDialogStore();
  const queryClient = useQueryClient();
  const location = useLocation();

  // Extract tool ID from current URL path (e.g., /admin/tools/7286b789-bca0-4327-9844-3df7e65b68dc/templates)
  const toolId = location.pathname.match(/\/admin\/tools\/([^/]+)\/templates/)?.[1] || null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tool: toolId || undefined,
      keywords: [],
      is_active: true,
    },
  });

  // Fetch tools
  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: getTools,
  });

  // Fetch fonts
  const { data: fonts = [] } = useQuery<Font[]>({
    queryKey: ["fonts"],
    queryFn: getFonts,
  });

  // Font upload mutation
  const fontUploadMutation = useMutation({
    mutationFn: (data: FormData) => addFont(data),
    onSuccess: () => {
      toast.success("Font uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["fonts"] });
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  // Reset form when dialog opens, but preserve tool selection if provided via URL
  useEffect(() => {
    if (dialogs.toolBuilder) {
      console.log('Dialog opened, toolId from URL:', toolId);
      form.reset({
        name: "",
        tool: toolId || undefined,
        tutorialUrl: "",
        tutorialTitle: "",
        keywords: [],
        is_active: true,
      });

      // Also explicitly set the tool value to ensure it's selected
      if (toolId) {
        form.setValue("tool", toolId);
        console.log('Set tool value to:', toolId);
      }
    }
  }, [dialogs.toolBuilder, form, toolId]);

  // Additional effect to handle toolId changes while dialog is open
  useEffect(() => {
    if (dialogs.toolBuilder && toolId && !form.getValues("tool")) {
      console.log('ToolId available, setting form value:', toolId);
      form.setValue("tool", toolId);
    }
  }, [toolId, dialogs.toolBuilder, form]);

  // Auto-generate tutorial title when name changes
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === "name" && value.name?.trim()) {
        const currentTitle = form.getValues("tutorialTitle");
        if (!currentTitle) {
          form.setValue("tutorialTitle", `How to use the ${value.name} tool`);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
      toast.success("Template created successfully");

      // Invalidate queries first, then navigate
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      if (toolId) {
        queryClient.invalidateQueries({ queryKey: ["templates", "tool", toolId] });
      }

      closeDialog("toolBuilder");
    },
    onError(error: Error) {
      toast.error(errorMessage(error));
      console.error("Error adding template:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    console.log('=== TEMPLATE CREATION DEBUG ===');
    console.log('Current toolId from URL:', toolId);
    console.log('Form values received:', values);
    console.log('Tools available:', tools);

    try {
      if (!values.svgFile) {
        console.error("SVG file is missing");
        return;
      }
      // Read SVG file
      const svgText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(values.svgFile as File);
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('svg', svgText);
      if (values.bannerFile) {
        formData.append('banner', values.bannerFile);
      }
      formData.append('type', 'tool');
      if (values.tool) {
        formData.append('tool', values.tool);
        console.log('Adding tool to form data:', values.tool);
      } else {
        console.log('No tool selected for template creation');
      }

      if (values.keywords && values.keywords.length > 0) {
        formData.append('keywords', JSON.stringify(values.keywords));
      }

      // Add tutorial data if provided
      if (values.tutorialUrl?.trim()) {
        formData.append('tutorial_url', values.tutorialUrl);
        console.log('Adding tutorial URL:', values.tutorialUrl);
      }
      if (values.tutorialTitle?.trim()) {
        formData.append('tutorial_title', values.tutorialTitle);
        console.log('Adding tutorial title:', values.tutorialTitle);
      }

      // Add font IDs if provided
      if (values.fontIds && values.fontIds.length > 0) {
        values.fontIds.forEach((fontId) => {
          formData.append('font_ids', fontId);
        });
      }

      formData.append('is_active', values.is_active ? 'true' : 'false');

      console.log('Form values:', values);
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

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
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keywords */}
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <TagInput
                        tags={field.value || []}
                        onChange={field.onChange}
                        placeholder="Add a keyword and press Enter"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-white/50">
                      These tags help trigger tool-specific logic. Press Enter or comma to add keywords.
                    </p>
                  </FormItem>
                )}
              />

              {/* Status Toggles */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-white/5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published Status</FormLabel>
                        <p className="text-sm text-white/40">Visible to users in listings</p>
                      </div>
                      <FormControl>
                        <div
                          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ${field.value ? 'bg-emerald-600' : 'bg-white/10'}`}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${field.value ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Tutorial Section */}
              <div className="relative">
                <div
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                    ${form.watch("tutorialUrl")?.trim()
                      ? 'border-white/10 bg-white/5'
                      : 'border-white/20 bg-white/5 hover:border-white/20 hover:bg-white/8'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                      ${form.watch("tutorialUrl")?.trim() ? 'bg-white text-black' : 'bg-white/20 text-white/60'}
                    `}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Tutorial (Optional)</h3>
                      <p className="text-sm text-white/60">Add a tutorial video to help users</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {/* Tutorial URL */}
                    <FormField
                      control={form.control}
                      name="tutorialUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tutorial URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://youtube.com/watch?v=..."
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tutorial Title */}
                    <FormField
                      control={form.control}
                      name="tutorialTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tutorial Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="How to use the tool"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                              disabled={!form.watch("name")?.trim()}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

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
                          ${isSvgDragActive
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
                    <LazyImage
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
                          ${isBannerDragActive
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
                  <LazyImage
                    src={URL.createObjectURL(bannerFile)}
                    alt="Banner Preview"
                    className="w-full h-40 max-h-60 border border-white/10 rounded-md p-2 bg-white/5 object-contain"
                  />
                </div>
              )}

              {/* Font Selection */}
              <FormField
                control={form.control}
                name="fontIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonts (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value && !field.value?.includes(value)) {
                              field.onChange([...(field.value || []), value]);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0">
                            <SelectValue placeholder="Select fonts used in this template" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-white/10 z-[999999]">
                            {fonts.length === 0 ? (
                              <SelectItem value="none" disabled className="text-white/60 italic">
                                No fonts available. Upload a font first.
                              </SelectItem>
                            ) : (
                              fonts
                                .filter((font) => !field.value?.includes(font.id))
                                .map((font) => (
                                  <SelectItem
                                    key={font.id}
                                    value={font.id}
                                    className="text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white/80"
                                  >
                                    {font.name}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((fontId) => {
                              const font = fonts.find((f) => f.id === fontId);
                              return (
                                <div
                                  key={fontId}
                                  className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-md text-sm"
                                >
                                  <span>{font?.name || fontId}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange(field.value?.filter((id) => id !== fontId));
                                    }}
                                    className="text-white/60 hover:text-white"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Font Upload */}
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-xs text-white/60 mb-2">Need to upload a new font?</p>
                          <input
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
                                formData.append('font_file', file);
                                fontUploadMutation.mutate(formData);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                            id="font-upload"
                            disabled={fontUploadMutation.isPending}
                          />
                          <label
                            htmlFor="font-upload"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-sm cursor-pointer transition-colors"
                          >
                            {fontUploadMutation.isPending ? 'Uploading...' : '📤 Upload Font'}
                          </label>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tool Selection */}
              <FormField
                control={form.control}
                name="tool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool (Optional)</FormLabel>
                    <FormControl>
                      <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}>
                        <SelectTrigger className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0">
                          <SelectValue placeholder="Select a tool" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-white/10 z-[999999]">
                          <SelectItem value="none" className="text-white/90 focus:bg-white/5 focus:text-white/80">
                            <span className="text-white/60 italic">No tool</span>
                          </SelectItem>
                          {tools.map((tool) => (
                            <SelectItem key={tool.id} value={tool.id} className="text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white/80">
                              <div className="flex items-center gap-2">
                                <span>🔧</span>
                                <span>{tool.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
