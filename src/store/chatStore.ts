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

export interface FieldUpdateSuggestion {
  id: string;
  value: string;
  old_value?: string;
}

export interface FieldSuggestion {
  suggestion_id: string;
  rationale: string;
  updates: FieldUpdateSuggestion[];
  status: "pending" | "approved" | "rejected";
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
  suggestions?: FieldSuggestion[];
}

export interface ChatSession {
  id: string;
  title: string;
  template?: string;
  purchased_template?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatStore {
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  isStreaming: boolean;
  statusText: string | null;
  fieldSnapshot: Record<string, string> | null;
  onTemplateLoad: ((templateId: string) => void) | null;
  activeInlineTemplateId: string | null;
  inlineEditorFields: Record<string, string>;
  svgCache: Record<string, string>;
  activeInlineTemplateFields: any[];
  suggestedTemplates: ToolCard[];
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
  fetchSessions: () => Promise<void>;
  loadSession: (sessionId: string, onTemplateLoad?: (id: string) => void) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  newChat: (chatMode?: "chat" | "create") => void;
  loadTemplateDirectly: (tpl: LoadedTemplate) => void;
  clearChat: () => void;
  takeSnapshot: (fields: any[]) => void;
  restoreSnapshot: () => Record<string, string> | null;
  cacheSvg: (templateId: string, svgText: string) => void;
  setActiveTemplateFields: (fields: any[]) => void;
  setChatMode: (mode: "chat" | "create") => void;
  approveSuggestion: (messageIndex: number, suggestionId: string, onUpdate: (id: string, value: string) => void) => void;
  rejectSuggestion: (messageIndex: number, suggestionId: string) => void;
}

const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  sessions: [],
  currentSessionId: null,
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

  fetchSessions: async () => {
    try {
      const res = await fetch(`${BASE_URL.replace(/\/+$/, "")}/ai-chat/sessions/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({ sessions: data });
      }
    } catch (err) {
      console.error("Failed to fetch chat sessions", err);
    }
  },

  loadSession: async (sessionId, onTemplateLoad) => {
    set({ isStreaming: true, currentSessionId: sessionId, messages: [] });
    try {
      const res = await fetch(`${BASE_URL.replace(/\/+$/, "")}/ai-chat/sessions/${sessionId}/messages/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Map backend messages to frontend ChatMessage structure
        const msgs: ChatMessage[] = data.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content || "",
          attachmentUrl: m.metadata?.attachmentUrl,
          toolCards: m.metadata?.tool_cards,
          clarification: m.metadata?.clarification?.[0], // Metadata stores arrays of events per message
          loadedTemplate: m.metadata?.template_loaded?.[0]?.template,
          purchasedTemplate: m.metadata?.purchased?.[0]?.template,
          documentFile: m.metadata?.document_ready?.[0]?.file,
          suggestions: m.metadata?.field_suggestion?.map((s: any) => ({ ...s, status: "pending" })),
        }));
        
        // If the last assistant message has a loaded template, set it as active
        const lastWithTemplate = [...msgs].reverse().find(m => m.loadedTemplate);
        if (lastWithTemplate?.loadedTemplate) {
          set({ activeInlineTemplateId: lastWithTemplate.loadedTemplate.id });
          if (onTemplateLoad) onTemplateLoad(lastWithTemplate.loadedTemplate.id);
        }

        set({ messages: msgs, isStreaming: false });
      }
    } catch (err) {
      console.error("Failed to load session history", err);
      set({ isStreaming: false });
    }
  },

  deleteSession: async (sessionId) => {
    try {
      const res = await fetch(`${BASE_URL.replace(/\/+$/, "")}/ai-chat/sessions/${sessionId}/`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          messages: state.currentSessionId === sessionId ? [] : state.messages,
        }));
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  },

  renameSession: async (sessionId, title) => {
    try {
      const res = await fetch(`${BASE_URL.replace(/\/+$/, "")}/ai-chat/sessions/${sessionId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, title } : s)),
        }));
      }
    } catch (err) {
      console.error("Failed to rename session", err);
    }
  },

  newChat: (mode) => {
    set({
      currentSessionId: null,
      messages: [],
      activeInlineTemplateId: null,
      inlineEditorFields: {},
      activeInlineTemplateFields: [],
      suggestedTemplates: [],
      chatMode: mode || get().chatMode
    });
  },

  approveSuggestion: (msgIdx, sugId, onUpdate) => {
    set((state) => {
      const msgs = [...state.messages];
      const msg = msgs[msgIdx];
      if (!msg?.suggestions) return state;

      const suggestion = msg.suggestions.find((s) => s.suggestion_id === sugId);
      if (suggestion && suggestion.status === "pending") {
        suggestion.status = "approved";
        const newFields = { ...state.inlineEditorFields };
        suggestion.updates.forEach((upd) => {
          newFields[upd.id] = upd.value;
          onUpdate(upd.id, upd.value);
        });
        return { 
          messages: msgs,
          inlineEditorFields: newFields
        };
      }
      return { messages: msgs };
    });
  },

  rejectSuggestion: (msgIdx, sugId) => {
    set((state) => {
      const msgs = [...state.messages];
      const msg = msgs[msgIdx];
      if (!msg?.suggestions) return state;

      const suggestion = msg.suggestions.find((s) => s.suggestion_id === sugId);
      if (suggestion && suggestion.status === "pending") {
        suggestion.status = "rejected";
      }
      return { messages: msgs };
    });
  },

  cacheSvg: (templateId, svgText) =>
    set((state) => ({ svgCache: { ...state.svgCache, [templateId]: svgText } })),

  setActiveTemplateFields: (fields) =>
    set({ activeInlineTemplateFields: fields }),

  sendMessage: (content, { templateId, purchasedTemplateId, currentValues, imageBase64, onFieldUpdate, onTemplateLoad }) => {
    const userMessage: ChatMessage = { 
      role: "user", 
      content,
      attachmentUrl: imageBase64 
    };
    const updatedMessages = [...get().messages, userMessage];

    set({
      messages: updatedMessages,
      isStreaming: true,
    });

    const assistantIdx = updatedMessages.length;
    set((state) => ({
      messages: [
        ...state.messages,
        { role: "assistant", content: "", fieldUpdates: [], isStreaming: true },
      ],
    }));

    const { activeInlineTemplateId, chatMode, currentSessionId } = get();
    const body: Record<string, unknown> = {
      session_id: currentSessionId,
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
            // Refresh sessions list after message finishes to catch new titles
            get().fetchSessions();
            return Promise.resolve();
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "session_id") {
                if (!get().currentSessionId) set({ currentSessionId: event.id });
              } else if (event.type === "session_updated") {
                set((state) => ({
                  sessions: state.sessions.map(s => s.id === state.currentSessionId ? { ...s, title: event.title } : s)
                }));
              } else if (event.type === "status") {
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
                const resolvedValue =
                  event.value === "[[ATTACHED_IMAGE]]" && imageBase64
                    ? imageBase64
                    : event.value;
                onFieldUpdate(event.id, resolvedValue);
                set((state) => ({
                  inlineEditorFields: { ...state.inlineEditorFields, [event.id]: resolvedValue },
                }));
              } else if (event.type === "tool_cards") {
                set({ suggestedTemplates: event.cards });
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
              } else if (event.type === "field_suggestion") {
                set((state) => {
                  const msgs = [...state.messages];
                  if (msgs[assistantIdx]) {
                    const suggestions = msgs[assistantIdx].suggestions || [];
                    suggestions.push({
                      ...event,
                      status: "pending"
                    });
                    msgs[assistantIdx] = { ...msgs[assistantIdx], suggestions };
                  }
                  return { messages: msgs };
                });
              } else if (event.type === "purchase_error" || event.type === "download_error") {
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
              // skip
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
      currentSessionId: null,
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
