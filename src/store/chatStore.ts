import { create } from "zustand";
import { BASE_URL } from "@/api/apiClient";
import type { FormField } from "@/types";

export interface ClarificationOption {
  label: string;
  value: string;
  template_id?: string;
  style?: string; // Custom CSS style string injected on the button element
}

export interface LoadedTemplate {
  id: string;
  name: string;
  toolName: string;
  price: string;
  banner: string;
  field_count: number;
  svg_content?: string;
  form_fields?: FormField[];
}

export interface PurchasedTemplateInfo {
  id: string;
  name: string;
  price: string;
  new_balance: string;
  field_count: number;
}

export interface DocumentFile {
  data: string; // base64 data URI
  filename: string;
  mime: string;
}

export interface ToolCard {
  id: string;
  name: string;
  description: string;
  price: string;
  toolName: string;
  banner: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fieldUpdates?: string[];
  hasFieldUpdates?: boolean;  // true when AI updated at least 1 field this turn
  isStreaming?: boolean;
  attachmentUrl?: string;
  toolCards?: ToolCard[];
  clarification?: {
    question: string;
    options: ClarificationOption[];
  };
  loadedTemplate?: LoadedTemplate;
  purchasedTemplate?: PurchasedTemplateInfo;
  documentFile?: DocumentFile;
}

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  statusText: string | null;
  fieldSnapshot: Record<string, string> | null;
  onTemplateLoad: ((templateId: string) => void) | null;
  activeInlineTemplateId: string | null;
  inlineEditorFields: Record<string, string>;
  /** SVG text cache keyed by template ID — avoids re-fetching on every message */
  /** SVG text cache keyed by template ID — avoids re-fetching on every message */
  svgCache: Record<string, string>;
  /** Field definitions for the currently active inline template */
  activeInlineTemplateFields: any[];
  /** Latest recommended templates from the AI */
  suggestedTemplates: ToolCard[];
  /** Current UI mode for the chat */
  chatMode: "chat" | "create";

  sendMessage: (
    content: string,
    opts: {
      templateId?: string;
      purchasedTemplateId?: string;
      currentValues: Record<string, string>;
      imageBase64?: string;
      onFieldUpdate: (id: string, value: string) => void;
      onTemplateLoad?: (templateId: string) => void;
    }
  ) => void;
  /** Load a template inline without an AI round-trip (e.g. from clarification option clicks) */
  loadTemplateDirectly: (tpl: LoadedTemplate) => void;
  clearChat: () => void;
  takeSnapshot: (fields: any[]) => void;
  restoreSnapshot: () => Record<string, string> | null;
  cacheSvg: (templateId: string, svgText: string) => void;
  setActiveTemplateFields: (fields: any[]) => void;
  setChatMode: (mode: "chat" | "create") => void;
}

const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  statusText: null,
  fieldSnapshot: null,
  onTemplateLoad: null,
  activeInlineTemplateId: null,
  inlineEditorFields: {},
  svgCache: {},
  activeInlineTemplateFields: [],
  suggestedTemplates: [],
  chatMode: "create",

  setChatMode: (mode) => set({ chatMode: mode }),

  cacheSvg: (templateId, svgText) =>
    set((state) => ({ svgCache: { ...state.svgCache, [templateId]: svgText } })),

  setActiveTemplateFields: (fields) =>
    set({ activeInlineTemplateFields: fields }),

  sendMessage: (content, { templateId, purchasedTemplateId, currentValues, imageBase64, onFieldUpdate, onTemplateLoad }) => {
    const userMessage: ChatMessage = { 
      role: "user", 
      content,
      attachmentUrl: imageBase64 // Store the actual base64 so it can be re-sent in history
    };
    const updatedMessages = [...get().messages, userMessage];

    set({
      messages: updatedMessages,
      isStreaming: true,
    });

    // Add empty streaming assistant message
    const assistantIdx = updatedMessages.length;
    set((state) => ({
      messages: [
        ...state.messages,
        { role: "assistant", content: "", fieldUpdates: [], isStreaming: true },
      ],
    }));

    const { activeInlineTemplateId, chatMode } = get();
    const body: Record<string, unknown> = {
      messages: updatedMessages.map(({ role, content, attachmentUrl }) => ({ 
        role, 
        content, 
        attachmentUrl 
      })),
      current_values: currentValues,
      chat_mode: chatMode,
    };
    if (templateId || activeInlineTemplateId) body.template_id = templateId || activeInlineTemplateId;
    if (purchasedTemplateId) body.purchased_template_id = purchasedTemplateId;
    if (imageBase64) body.image_base64 = imageBase64;

    const fieldUpdatesForMsg: string[] = [];

    fetch(`${BASE_URL.replace(/\/+$/, "")}/ai-chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processChunk = (done: boolean, value?: Uint8Array): Promise<void> => {
          if (done) {
            set((state) => {
              const msgs = [...state.messages];
              if (msgs[assistantIdx]) {
                msgs[assistantIdx] = {
                  ...msgs[assistantIdx],
                  isStreaming: false,
                  fieldUpdates: fieldUpdatesForMsg,
                };
              }
              return { messages: msgs, isStreaming: false, statusText: null };
            });
            return Promise.resolve();
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "status") {
                set({ statusText: event.label ?? null });
              } else if (event.type === "text") {
                set({ statusText: null });
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    msgs[assistantIdx] = {
                      ...msgs[assistantIdx],
                      content: msgs[assistantIdx].content + event.delta,
                    };
                  }
                  return { messages: msgs };
                });
              } else if (event.type === "field_update") {
                fieldUpdatesForMsg.push(event.id);
                // Replace [[ATTACHED_IMAGE]] placeholder with the actual base64
                const resolvedValue =
                  event.value === "[[ATTACHED_IMAGE]]" && imageBase64
                    ? imageBase64
                    : event.value;
                onFieldUpdate(event.id, resolvedValue);
                // Mirror updates into inlineEditorFields so InlineTemplateEditor can react
                set((state) => ({
                  inlineEditorFields: { ...state.inlineEditorFields, [event.id]: resolvedValue },
                }));
              } else if (event.type === "tool_cards") {
                // Store tool cards globally for the right preview panel
                set({ suggestedTemplates: event.cards });
                
                // Also store in the specific message if no template is actively being edited
                const { activeInlineTemplateId } = get();
                if (!activeInlineTemplateId) {
                  set((state) => {
                    const msgs = [...state.messages];
                    if (msgs[assistantIdx]) {
                      msgs[assistantIdx] = {
                        ...msgs[assistantIdx],
                        toolCards: event.cards,
                      };
                    }
                    return { messages: msgs };
                  });
                }
              } else if (event.type === "clarification") {
                // Store clarification options in the current assistant message
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    msgs[assistantIdx] = {
                      ...msgs[assistantIdx],
                      clarification: {
                        question: event.question,
                        options: event.options,
                      },
                    };
                  }
                  return { messages: msgs };
                });
              } else if (event.type === "template_loaded") {
                // Store loaded template - inline editor will show in chat
                const tpl = event.template;
                if (onTemplateLoad && tpl?.id) {
                  onTemplateLoad(tpl.id);
                }
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    msgs[assistantIdx] = { ...msgs[assistantIdx], loadedTemplate: tpl };
                  }
                  return {
                    messages: msgs,
                    activeInlineTemplateId: tpl?.id || null,
                    inlineEditorFields: {},
                  };
                });
              } else if (event.type === "purchased") {
                // Template purchased successfully
                const pt = event.template;
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    msgs[assistantIdx] = {
                      ...msgs[assistantIdx],
                      purchasedTemplate: pt,
                    };
                  }
                  return { messages: msgs };
                });
              } else if (event.type === "document_ready") {
                // Document ready for download
                const file = event.file;
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    msgs[assistantIdx] = {
                      ...msgs[assistantIdx],
                      documentFile: file,
                    };
                  }
                  return { messages: msgs };
                });
              } else if (event.type === "purchase_error") {
                // Purchase failed
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    msgs[assistantIdx] = {
                      ...msgs[assistantIdx],
                      content: msgs[assistantIdx].content + `\n\n⚠️ ${event.message}`,
                    };
                  }
                  return { messages: msgs };
                });
              } else if (event.type === "download_error") {
                // Download failed
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    msgs[assistantIdx] = {
                      ...msgs[assistantIdx],
                      content: msgs[assistantIdx].content + `\n\n⚠️ ${event.message}`,
                    };
                  }
                  return { messages: msgs };
                });
              } else if (event.type === "done") {
                set({ statusText: null });
                // Mark message as having field updates (for UI badge logic)
                if (fieldUpdatesForMsg.length > 0) {
                  set((state) => {
                    const msgs = [...state.messages];
                    if (msgs[assistantIdx]) {
                      msgs[assistantIdx] = {
                        ...msgs[assistantIdx],
                        hasFieldUpdates: true,
                        fieldUpdates: fieldUpdatesForMsg,
                      };
                    }
                    return { messages: msgs };
                  });
                }
              }
            } catch {
              // Malformed SSE line — skip
            }
          }

          return reader.read().then(({ done, value }) => processChunk(done, value));
        };

        return reader.read().then(({ done, value }) => processChunk(done, value));
      })
      .catch((err) => {
        set((state) => {
          const msgs = [...state.messages];
          if (msgs[assistantIdx]) {
            msgs[assistantIdx] = {
              ...msgs[assistantIdx],
              content: "Something went wrong. Please try again.",
              isStreaming: false,
            };
          }
          return { messages: msgs, isStreaming: false, statusText: null };
        });
        console.error("[AiChat]", err);
      });
  },

  loadTemplateDirectly: (tpl) => {
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: `Loaded **${tpl.name}**. Tell me what to fill in.`,
      loadedTemplate: tpl,
    };
    set((state) => ({
      messages: [...state.messages, assistantMsg],
      activeInlineTemplateId: tpl.id,
      inlineEditorFields: {},
    }));
  },

  clearChat: () =>
    set({
      messages: [],
      isStreaming: false,
      activeInlineTemplateId: null,
      inlineEditorFields: {},
      activeInlineTemplateFields: [],
      suggestedTemplates: [],
    }),

  takeSnapshot: (fields) => {
    const snapshot: Record<string, string> = {};
    for (const f of fields) {
      if (f.id) snapshot[f.id] = (f.currentValue as string) ?? "";
    }
    set({ fieldSnapshot: snapshot });
  },

  restoreSnapshot: () => {
    return get().fieldSnapshot;
  },
}));

export default useChatStore;
