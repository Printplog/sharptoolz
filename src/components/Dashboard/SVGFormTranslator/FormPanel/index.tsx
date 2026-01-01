import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  Loader2,
  Copy,
  PenLine,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import useToolStore from "@/store/formStore";
import {
  useLocation,
  useNavigate,
  useParams,
  useBeforeUnload,
  UNSAFE_NavigationContext,
} from "react-router-dom";
import { toast } from "sonner";
import FormFieldComponent from "../FormField";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { purchaseTemplate, updatePurchasedTemplate, getPurchasedTemplate } from "@/api/apiEndpoints";
import type { PurchasedTemplate, FieldUpdate } from "@/types";
import errorMessage from "@/lib/utils/errorMessage";
import { DownloadDocDialog } from "../../Documents/DownloadDoc";
import { generateValue, applyMaxGeneration } from "@/lib/utils/fieldGenerator";
import React, { useEffect, useMemo, useState, useRef, useContext, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import type { Tutorial } from "@/types";
import { FormPanelHeader } from "./FormPanelHeader";
import { TestDocumentDialog } from "./TestDocumentDialog";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";


type NavigationBlocker = {
  state: "blocked" | "unblocked";
  proceed: () => void;
  reset: () => void;
};

function useNavigationBlocker(when: boolean): NavigationBlocker {
  const navigatorContext = useContext(UNSAFE_NavigationContext);
  const navigator = navigatorContext?.navigator as { block?: (cb: (tx: any) => void) => () => void } | undefined;
  const [state, setState] = useState<"blocked" | "unblocked">("unblocked");
  const retryRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!when || !navigator || typeof navigator.block !== "function") {
      retryRef.current = null;
      setState("unblocked");
      return;
    }
    const unblock = navigator.block((tx: any) => {
      const retry = () => {
        unblock();
        tx.retry();
      };
      retryRef.current = retry;
      setState("blocked");
    });
    return () => {
      unblock();
      retryRef.current = null;
      setState("unblocked");
    };
  }, [navigator, when]);

  const proceed = useCallback(() => {
    if (retryRef.current) {
      const retry = retryRef.current;
      retryRef.current = null;
      setState("unblocked");
      retry();
    }
  }, []);

  const reset = useCallback(() => {
    retryRef.current = null;
    setState("unblocked");
  }, []);

  return { state, proceed, reset };
}

const FormPanel = React.memo(function FormPanel({ test, tutorial, templateId, isPurchased: isPurchasedProp }: { test: boolean; tutorial?: Tutorial; templateId?: string; isPurchased?: boolean }) {
  // Use selectors to subscribe only to what we need - prevents re-renders when unrelated fields change
  const fields = useToolStore((state) => state.fields);
  const resetForm = useToolStore((state) => state.resetForm);
  const name = useToolStore((state) => state.name);
  const svgRaw = useToolStore((state) => state.svgRaw);
  const getFieldValue = useToolStore((state) => state.getFieldValue);
  const setName = useToolStore((state) => state.setName);
  const updateField = useToolStore((state) => state.updateField);
  const markFieldsSaved = useToolStore((state) => state.markFieldsSaved);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const derivedIsPurchased = pathname.includes("documents");
  const isPurchased = isPurchasedProp ?? derivedIsPurchased;
  const queryClient = useQueryClient();
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);
  const [documentProgress, setDocumentProgress] = useState(0);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Memoize touched fields check to avoid recalculating on every render
  const touchedFieldsCount = useMemo(
    () => fields?.filter(f => f.touched).length ?? 0,
    [fields]
  );

  const hasUnsavedChanges = useMemo(
    () => isPurchased && touchedFieldsCount > 0,
    [isPurchased, touchedFieldsCount]
  );

  const blocker = useNavigationBlocker(hasUnsavedChanges);
  const trackingField = useMemo(
    () =>
      fields?.find((field) => field.isTrackingId) ||
      fields?.find((field) => field.id === "Tracking_ID"),
    [fields]
  );

  // Memoize filtered fields to avoid re-filtering on every render
  const statusFields = useMemo(
    () => fields?.filter((field) => field.type === "status") ?? [],
    [fields]
  );

  const nonStatusFields = useMemo(
    () =>
      fields?.filter(
        (field) =>
          field.type !== "status" &&
          // Hide auto-generated .gen fields from the form (they'll be generated before save)
          !field.generationRule?.startsWith("AUTO:")
      ) ?? [],
    [fields]
  );

  const trackingIdValue = trackingField
    ? (() => {
        const value = getFieldValue(trackingField.id);
        if (value === undefined || value === null) return undefined;
        return typeof value === "string" ? value : String(value);
      })()
    : undefined;

  useBeforeUnload((event) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  // Track if we've applied duplicate values to prevent re-application
  const appliedDuplicateValuesRef = useRef(false);

  // Check for startValues in location state (from duplicate feature)
  useEffect(() => {
    if (location.state && location.state.startValues && fields && fields.length > 0 && !appliedDuplicateValuesRef.current) {
      const { startValues } = location.state as { startValues: Record<string, any> };
      
      Object.entries(startValues).forEach(([key, value]) => {
        // Find field to ensure it exists before updating
        const field = fields.find(f => f.id === key);
        if (field) {
          updateField(key, value as string | number | boolean);
        }
      });
      
      // Mark as applied so we don't do it again
      appliedDuplicateValuesRef.current = true;
    }
  }, [location.state, fields, updateField]);
  
  // Reset the ref when location changes (navigating to a different page)
  useEffect(() => {
    appliedDuplicateValuesRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedDialog(true);
    } else {
      setShowUnsavedDialog(false);
    }
  }, [blocker.state]);

  // Fetch purchased template data to get keywords for split download
  const { data: purchasedTemplateData } = useQuery<PurchasedTemplate>({
    queryKey: ["purchased-template", id],
    queryFn: () => getPurchasedTemplate(id as string),
    enabled: isPurchased && !!id,
  });

  const { mutateAsync: createAsync, isPending: createPending } = useMutation({
    mutationFn: (data: Partial<PurchasedTemplate>) => purchaseTemplate(data),
    onSuccess: (data) => {
      toast.success("Doc created successfully, you can download it now");
      navigate(`/documents/${data?.id}`);
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const { mutateAsync: updateAsync, isPending: updatePending } = useMutation({
    mutationFn: async (
      data: Partial<PurchasedTemplate> & { toastMessage?: string }
    ) => {
      const { toastMessage, ...payload } = data;
      await updatePurchasedTemplate(payload); // assume this is an async call
      return { toastMessage }; // return it so we can access it in onSuccess
    },
    onSuccess: (data) => {
      toast.success(data.toastMessage || "Doc updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["purchased-template"],
      });
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
      console.error(error);
    },
  });

  const createDocument = async (isTest: boolean) => {
    const mutateFn = isPurchased ? updateAsync : createAsync;
    if (!isAuthenticated) {
      navigate("/auth/login?dialog=register");
      toast.info("Please login to continue.");
      return;
    }
    
    // Show progress bar
    setIsCreatingDocument(true);
    setDocumentProgress(0);
    
    // Simulate progress
    let progressInterval: NodeJS.Timeout | null = null;
    
    const trackingField =
      fields?.find((field) => field.isTrackingId) ||
      fields?.find((field) => field.id === "Tracking_ID");
    const tracking_id = trackingField ? getFieldValue(trackingField.id) : undefined;
    const toastMessage =
      test === isTest ? "Document updated successfully" : "Document is now watermark free";

    // Build normalized field map for generation (selects use display text / label instead of raw id)
    const allFieldValues: Record<string, string | number | boolean> = {};
    (fields ?? []).forEach((field) => {
      if (field.type === "select" && field.options && field.options.length > 0) {
        const selected = field.options.find(
          (opt) => String(opt.value) === String(field.currentValue)
        );
        allFieldValues[field.id] =
          selected?.displayText ?? selected?.label ?? (field.currentValue ?? "");
      } else {
        allFieldValues[field.id] = (field.currentValue ?? "") as string | number | boolean;
      }
    });



    // Generate values for AUTO: gen fields before sending to backend
    // Skip regeneration for purchased docs - use existing values
    const autoGeneratedValues: Record<string, string> = {};
    if (!isPurchased) {
      (fields ?? [])
        .filter((field) => 
            // Generate if it has AUTO: prefix OR if it is a Tracking ID with a rule
            field.generationRule?.startsWith("AUTO:") || 
            (field.isTrackingId && field.generationRule)
        )
        .forEach((field) => {
          const maxLength = field.max || undefined;
          let generated = generateValue(field.generationRule as string, allFieldValues, maxLength);

          if (field.maxGeneration) {
            generated = applyMaxGeneration(generated, field.maxGeneration);
          }

          autoGeneratedValues[field.id] = generated;
          // Update map so later AUTO fields can depend on earlier ones
          allFieldValues[field.id] = generated;
        });
    }

    // Determine final tracking ID (either from auto-gen or current value)
    let finalTrackingId = tracking_id;
    if (trackingField && !isPurchased) {
        if (autoGeneratedValues[trackingField.id]) {
            finalTrackingId = autoGeneratedValues[trackingField.id];
        }
    }

    const fieldUpdates: FieldUpdate[] =
      (fields ?? [])
        .filter(
          (field) =>
            !isPurchased ||
            field.touched
            // For purchased docs, only send touched fields (don't regenerate AUTO fields)
        )
        .map((field) => {
          let valueToSend = field.currentValue ?? "";
          
          // Use auto-generated value if available
          if (!isPurchased && field.generationRule?.startsWith("AUTO:") && autoGeneratedValues[field.id]) {
            valueToSend = autoGeneratedValues[field.id];
          }
          
          // Use re-calculated Tracking ID if this is the tracking field
          if (!isPurchased && field.id === trackingField?.id && finalTrackingId) {
            valueToSend = finalTrackingId;
          }

          return {
            id: field.id,
            value: valueToSend,
          };
        });

    const payload: Partial<PurchasedTemplate> & {
      toastMessage: string;
      field_updates?: FieldUpdate[];
    } = {
      id: id,
      ...(!isPurchased ? { template: id ?? undefined } : { name }),
      tracking_id: finalTrackingId as string,
      test: isTest,
      toastMessage,
    };

    if (fieldUpdates.length > 0) {
      payload.field_updates = fieldUpdates;
    }

    // Start progress simulation
    progressInterval = setInterval(() => {
      setDocumentProgress((prev) => {
        if (prev >= 90) {
          return 90; // Stop at 90% until request completes
        }
        return prev + 15;
      });
    }, 300);

    try {
      await mutateFn(payload);
      // Complete progress
      if (progressInterval) clearInterval(progressInterval);
      setDocumentProgress(100);
      // Wait a moment before hiding
      setTimeout(() => {
        setIsCreatingDocument(false);
        setDocumentProgress(0);
        // Close dialog only after successful creation
        setShowTestDialog(false);
      }, 500);
      
      if (isPurchased && fieldUpdates.length > 0) {
        markFieldsSaved(fieldUpdates.map((field) => field.id));
      }
    } catch (error) {
      // Reset on error
      if (progressInterval) clearInterval(progressInterval);
      setIsCreatingDocument(false);
      setDocumentProgress(0);
      // Don't close dialog on error - let user see the error and try again
      throw error;
    }
  };

  const handleDownloadClick = () => {
    if (!isPurchased) {
      toast.error("Create your document first to download it.");
      return;
    }
    if (hasUnsavedChanges) {
      toast.error("Please update your document to save recent changes before downloading.");
      return;
    }
    navigate("?dialog=download-doc");
  };

  const handleCopyTracking = () => {
    if (!trackingIdValue) return;
    navigator.clipboard.writeText(trackingIdValue);
    toast.success("Tracking ID copied!");
  };

  const handleStayOnPage = () => {
    setShowUnsavedDialog(false);
    blocker.reset();
  };

  const handleLeaveWithoutSaving = () => {
    setShowUnsavedDialog(false);
    blocker.proceed();
  };

  const handleSaveAndLeave = async () => {
    if (!hasUnsavedChanges) {
      handleLeaveWithoutSaving();
      return;
    }
    try {
      setIsSavingBeforeLeave(true);
      await createDocument(test);
      setShowUnsavedDialog(false);
      blocker.proceed();
    } catch (error) {
      blocker.reset();
    } finally {
      setIsSavingBeforeLeave(false);
    }
  };

  return (
    <>
    {/* Document Creation Progress Bar */}
    {isCreatingDocument && (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4 mb-4">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span className="font-medium">
            {isPurchased 
              ? (updatePending ? "Updating Document..." : "Document Updated!")
              : (createPending ? "Creating Document..." : "Document Created!")
            }
          </span>
          <span className="text-white/60">{documentProgress}%</span>
        </div>
        <Progress value={documentProgress} className="h-2" />
        <p className="text-xs text-white/50 text-center">
          {documentProgress < 100 
            ? "Processing your document, please wait..."
            : "Document ready!"
          }
        </p>
      </div>
    )}
    
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
      <FormPanelHeader
        isPurchased={isPurchased}
        tutorial={tutorial}
        onReset={resetForm}
        trackingId={trackingIdValue}
        trackingLink={trackingField?.link}
        onCopyTracking={handleCopyTracking}
        name={name}
        onNameChange={setName}
      />

      <div className="space-y-3">
        {statusFields.map((field, index) => (
            <FormFieldComponent
              key={`${field.id}-${index}`}
              field={field}
              allFields={fields}
              tutorial={tutorial}
            />
          ))}
        <div className="m-0 p-0 border-0 space-y-3">
          {nonStatusFields.map((field, index) => (
              <FormFieldComponent 
                key={`${field.id}-${index}`} 
                field={field} 
                allFields={fields} 
                isPurchased={isPurchased}
                tutorial={tutorial}
              />
            ))}
        </div>
      </div>

      {/* Tutorial Button - Only show for regular templates, not purchased ones */}
      {tutorial && !isPurchased && (
        <div className="pt-4 border-t border-white/20">
          <Button
            asChild
            variant="outline"
            className="w-full hover:bg-black/50 hover:text-white"
          >
            <a
              href={tutorial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              {tutorial.title || "Watch Tutorial"}
            </a>
          </Button>
        </div>
      )}

      {/* Buttons */}
      <div className="pt-4 border-t border-white/20 flex flex-col lg:flex-row justify-end gap-5 ">
        {isPurchased && test && (
          <Button
            variant={"outline"}
            disabled={createPending || updatePending}
            onClick={() => {
              void createDocument(false);
            }}
            className="py-6 px-10 hover:bg-black/50 hover:text-white"
          >
            <>
              {updatePending ? "Removing Watermark" : "Remove Watermark"}
              {updatePending ? (
                <PenLine className="animate-spin" />
              ) : (
                <Upload className="w-4 h-4 ml-1" />
              )}
            </>
          </Button>
        )}

        {!isPurchased ? (
          <Button
            variant="outline"
            disabled={createPending || updatePending || isCreatingDocument}
            onClick={() => {
              if (!isAuthenticated) {
                toast.info("Please login to continue");
                navigate("?dialog=register");
              } else {
                setShowTestDialog(true);
              }
            }}
            className="py-6 px-10 hover:bg-black/50 hover:text-white"
          >
            <>
              {createPending || isCreatingDocument ? "Creating Document" : "Create Document"}
              {createPending || isCreatingDocument ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload className="w-4 h-4 ml-1" />
              )}
            </>
          </Button>
        ) : (
          <>
            {templateId && (
              <Button
                variant="outline"
                onClick={() => {
                   // Gather current values
                   const currentValues: Record<string, any> = {};
                   fields?.forEach(f => {
                       currentValues[f.id] = f.currentValue;
                   });
                   
                   navigate(`/tools/${templateId}`, { 
                       state: { 
                           startValues: currentValues 
                       } 
                   });
                }}
                className="py-6 px-10 hover:bg-black/50 hover:text-white"
              >
                Duplicate Document
                <Copy className="w-4 h-4 ml-1" />
              </Button>
            )}
            <Button
              variant="outline"
              disabled={createPending || updatePending || isCreatingDocument}
              onClick={() => {
                void createDocument(test);
              }}
              className="py-6 px-10 hover:bg-black/50 hover:text-white"
            >
              <>
                {updatePending || isCreatingDocument ? "Updating Document" : "Update Document"}
                {updatePending || isCreatingDocument ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 ml-1" />
                )}
              </>
            </Button>
          </>
        )}

        <Button
          disabled={createPending || updatePending}
          onClick={handleDownloadClick}
          className="py-6 px-10 bg-primary/90 text-black hover:bg-primary hover:text-black w-full sm:w-auto"
        >
          <>
            Download Document
            <Download className="w-4 h-4 ml-1" />
          </>
        </Button>
        <DownloadDocDialog 
          svg={svgRaw} 
          purchasedTemplateId={isPurchased ? id : undefined} 
          templateName={name}
          keywords={purchasedTemplateData?.keywords || []}
        />
        <TestDocumentDialog
          open={showTestDialog}
          onOpenChange={(open) => {
            // Only allow closing if not submitting
            if (!createPending && !updatePending && !isCreatingDocument) {
              setShowTestDialog(open);
            }
          }}
          onCreateTest={() => {
            void createDocument(true);
            // Don't close dialog here - it will close after successful creation
          }}
          onCreatePaid={() => {
            void createDocument(false);
            // Don't close dialog here - it will close after successful creation
          }}
          isSubmitting={createPending || updatePending || isCreatingDocument}
        />
      </div>
    </div>

    <UnsavedChangesDialog
      open={showUnsavedDialog}
      onStay={handleStayOnPage}
      onLeave={handleLeaveWithoutSaving}
      onSaveAndLeave={handleSaveAndLeave}
      isSaving={isSavingBeforeLeave}
      disableActions={createPending || updatePending}
    />
    </>
  );
});

FormPanel.displayName = 'FormPanel';

export default FormPanel;
