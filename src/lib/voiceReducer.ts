"use client";

/**
 * voiceReducer — single source of truth for the /voice page's "brief".
 *
 * The chat agent emits tool calls (set_slot / set_language / regenerate /
 * add_badge / export_* / undo). Each tool call is dispatched here, mutating
 * the brief in a predictable way. Every mutating action also pushes the
 * pre-mutation state onto an undoStack so the `undo` tool can pop it.
 *
 * Kept intentionally small — the page owns async work (rendering posters,
 * building ZIPs, encoding MP4). This reducer only owns state.
 */

export type SurfaceKind = "poster" | "whatsapp" | "square";

export interface PosterCell {
  langCode: string;
  loading: boolean;
  image?: string;
  mimeType?: string;
  error?: string;
}

export interface Brief {
  productName: string;
  price: string;
  businessName: string;
  brandColor: string;
  languageCodes: string[]; // languages currently selected for rendering
  surface: SurfaceKind;
  badges: string[]; // e.g. ["FESTIVE", "SALE"]
  cells: PosterCell[]; // current poster state (one per languageCode)
}

export type SlotField = "productName" | "price" | "businessName" | "brandColor";

export type VoiceAction =
  | { type: "set_slot"; field: SlotField; value: string }
  | { type: "set_language"; codes: string[] }
  | { type: "set_surface"; surface: SurfaceKind }
  | { type: "add_badge"; badge: string }
  | { type: "remove_badge"; badge: string }
  | { type: "regenerate_start"; codes: string[] }
  | {
      type: "regenerate_cell_done";
      langCode: string;
      image?: string;
      mimeType?: string;
      error?: string;
    }
  | { type: "reset" }
  | { type: "undo" };

export interface VoiceState {
  brief: Brief;
  undoStack: Brief[];
}

export const INITIAL_BRIEF: Brief = {
  productName: "",
  price: "",
  businessName: "",
  brandColor: "#F26B1F",
  languageCodes: [],
  surface: "poster",
  badges: [],
  cells: [],
};

export const INITIAL_STATE: VoiceState = {
  brief: INITIAL_BRIEF,
  undoStack: [],
};

const MAX_UNDO = 20;

function pushUndo(stack: Brief[], brief: Brief): Brief[] {
  const next = [...stack, brief];
  if (next.length > MAX_UNDO) next.shift();
  return next;
}

export function voiceReducer(
  state: VoiceState,
  action: VoiceAction,
): VoiceState {
  switch (action.type) {
    case "set_slot":
      return {
        brief: { ...state.brief, [action.field]: action.value },
        undoStack: pushUndo(state.undoStack, state.brief),
      };
    case "set_language":
      return {
        brief: { ...state.brief, languageCodes: action.codes },
        undoStack: pushUndo(state.undoStack, state.brief),
      };
    case "set_surface":
      return {
        brief: { ...state.brief, surface: action.surface },
        undoStack: pushUndo(state.undoStack, state.brief),
      };
    case "add_badge":
      if (state.brief.badges.includes(action.badge)) return state;
      return {
        brief: {
          ...state.brief,
          badges: [...state.brief.badges, action.badge],
        },
        undoStack: pushUndo(state.undoStack, state.brief),
      };
    case "remove_badge":
      return {
        brief: {
          ...state.brief,
          badges: state.brief.badges.filter((b) => b !== action.badge),
        },
        undoStack: pushUndo(state.undoStack, state.brief),
      };
    case "regenerate_start": {
      const cells: PosterCell[] = action.codes.map((code) => ({
        langCode: code,
        loading: true,
      }));
      return {
        brief: {
          ...state.brief,
          languageCodes: action.codes.length
            ? action.codes
            : state.brief.languageCodes,
          cells,
        },
        // A render is a destination, not an edit — don't clutter undo.
        undoStack: state.undoStack,
      };
    }
    case "regenerate_cell_done": {
      const cells = state.brief.cells.map((c) =>
        c.langCode === action.langCode
          ? {
              ...c,
              loading: false,
              image: action.image,
              mimeType: action.mimeType,
              error: action.error,
            }
          : c,
      );
      return { ...state, brief: { ...state.brief, cells } };
    }
    case "reset":
      return INITIAL_STATE;
    case "undo": {
      const prev = state.undoStack[state.undoStack.length - 1];
      if (!prev) return state;
      return {
        brief: prev,
        undoStack: state.undoStack.slice(0, -1),
      };
    }
    default:
      return state;
  }
}

// ---- Tool-call contract from /api/chat ------------------------------------

/**
 * The other agent is expanding /api/chat to (optionally) return
 *
 *   { kind: "tool_calls", toolCalls: ToolCall[], message?: string, language?: string }
 *
 * alongside the existing "message" and "finalize" replies. Each ToolCall is
 * one of the shapes below. The client executes them in order, dispatches
 * matching reducer actions, and appends an inline artifact card per call.
 */
export type ToolCall =
  | {
      id: string;
      name: "set_slot";
      args: { field: SlotField; value: string };
    }
  | {
      id: string;
      name: "set_language";
      args: { codes: string[] };
    }
  | {
      id: string;
      name: "set_surface";
      args: { surface: SurfaceKind };
    }
  | {
      id: string;
      name: "regenerate";
      args: { codes?: string[] };
    }
  | {
      id: string;
      name: "add_badge";
      args: { badge: string };
    }
  | {
      id: string;
      name: "remove_badge";
      args: { badge: string };
    }
  | {
      id: string;
      name: "export_zip";
      args?: Record<string, never>;
    }
  | {
      id: string;
      name: "export_pdf";
      args?: Record<string, never>;
    }
  | {
      id: string;
      name: "export_mp4";
      args?: Record<string, never>;
    }
  | {
      id: string;
      name: "undo";
      args?: Record<string, never>;
    };
