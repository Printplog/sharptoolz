import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { useDropzone } from "react-dropzone";

export default function BuilderDialog() {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
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

  return (
    <CustomDialog dialogName="toolBuilder">
      <DialogContent className="bg-gray-900 border-white/20 text-white max-w-3xl w-full p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Tool Builder</DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 pt-0 space-y-6">
          {file && (
            <div className="mt-4">
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

          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
              disabled={!file}
            >
              Build Tool
            </button>
          </div>
        </div>
      </DialogContent>
    </CustomDialog>
  );
}
