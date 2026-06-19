"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";

type Mode = "popup" | "fullscreen";
type View = "sessions" | "chat";

interface Trip {
  id: number;
  name: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

interface ChatSession {
  id: number;
  title: string | null;
  created_at: string;
  message_count: number;
}

interface ChatMessage {
  id: number;
  role: "user" | "model" | "summary";
  content: string;
  created_at: string;
}

interface ApiError extends Error {
  status?: number;
  wait_seconds?: number;
  error?: string;
}

interface Category {
  id: number;
  name: string;
}

interface SuggestionAddItem {
  type: "add_item";
  name: string;
  bag_id: number;
  bag_name: string;
  category?: string;
  quantity?: number;
}

interface SuggestionAddSubItem {
  type: "add_sub_item";
  item_id: number;
  item_name: string;
  bag_id: number;
  bag_name: string;
  new_sub_item: { name: string; quantity: number };
  also_convert_original?: boolean;
  original_name?: string;
}

interface SuggestionCreateBag {
  type: "create_bag";
  name: string;
  bag_type: string;
  items: string[];
}

type Suggestion =
  | SuggestionAddItem
  | SuggestionAddSubItem
  | SuggestionCreateBag;

function useCountdown(seconds: number, onDone: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (seconds <= 0) return;
    setRemaining(seconds);
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          onDone();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]); // eslint-disable-line react-hooks/exhaustive-deps
  return remaining;
}

function formatTime(s: number) {
  return s >= 60 ? `${Math.ceil(s / 60)}m` : `${s}s`;
}

function extractTripIdFromPath(pathname: string): number | null {
  const m = pathname.match(/^\/trips\/(\d+)/);
  return m ? Number(m[1]) : null;
}

// ─── Markdown components ───────────────────────────────────────────────────

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => (
    <p style={{ margin: "0 0 8px", lineHeight: "1.6" }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "4px 0 8px", paddingLeft: "18px" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "4px 0 8px", paddingLeft: "18px" }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: "4px", lineHeight: "1.5" }}>{children}</li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  h1: ({ children }) => (
    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>{children}</p>
  ),
  h2: ({ children }) => (
    <p style={{ fontWeight: 700, margin: "0 0 6px" }}>{children}</p>
  ),
  h3: ({ children }) => (
    <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{children}</p>
  ),
};

// ─── Message bubble ────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          background: isUser ? "var(--primary)" : "var(--bg-surface)",
          color: isUser ? "var(--primary-foreground)" : "var(--foreground)",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          padding: "10px 14px",
          fontSize: "13px",
          wordBreak: "break-word",
        }}
      >
        {isUser ? (
          <span style={{ lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
            {msg.content}
          </span>
        ) : (
          <div style={{ lineHeight: "1.6" }}>
            <ReactMarkdown components={mdComponents}>
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trip selector ─────────────────────────────────────────────────────────

function TripSelector({
  trips,
  onSelect,
}: {
  trips: Trip[];
  onSelect: (t: Trip) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        padding: "24px",
      }}
    >
      <p
        style={{
          fontSize: "13px",
          color: "var(--fg-muted)",
          margin: 0,
          textAlign: "center",
        }}
      >
        Select a trip to start chatting
      </p>
      {trips.slice(0, 3).map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t)}
          style={{
            width: "100%",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "12px 16px",
            cursor: "pointer",
            textAlign: "left",
            transition: "box-shadow 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "var(--shadow-sm)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            {t.name}
          </div>
          {(t.start_date || t.end_date) && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--fg-muted)",
                marginTop: "2px",
              }}
            >
              {t.start_date ?? "—"} → {t.end_date ?? "—"}
            </div>
          )}
          {t.is_active && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--primary)",
                fontWeight: 600,
                marginTop: "4px",
                display: "inline-block",
              }}
            >
              Active
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Session list ──────────────────────────────────────────────────────────

function SessionList({
  trip,
  sessions,
  onSelect,
  onCreate,
  onBack,
  onDelete,
  loading,
}: {
  trip: Trip;
  sessions: ChatSession[];
  onSelect: (s: ChatSession) => void;
  onCreate: () => void;
  onBack: () => void;
  onDelete: (id: number) => void;
  loading: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            fontSize: "16px",
            padding: "2px 6px 2px 0",
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {trip.name}
          </div>
        </div>
        <button
          onClick={onCreate}
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            borderRadius: "8px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          + New chat
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          paddingTop: "12px",
        }}
      >
        {loading ? (
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            Loading…
          </p>
        ) : sessions.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: "8px",
              paddingTop: "32px",
            }}
          >
            <p
              style={{
                color: "var(--fg-muted)",
                fontSize: "13px",
                textAlign: "center",
                margin: 0,
              }}
            >
              No chats yet.
            </p>
            <button
              onClick={onCreate}
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Start a chat
            </button>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "box-shadow 150ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <button
                onClick={() => onSelect(s)}
                style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", minWidth: 0, padding: 0 }}
              >
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title ?? "New chat"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "2px", display: "flex", gap: "8px" }}>
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  {s.message_count > 0 && <span>{s.message_count} messages</span>}
                </div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                title="Delete chat"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: "16px", lineHeight: 1, padding: "2px 4px", flexShrink: 0 }}
              >×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Suggestion cards ──────────────────────────────────────────────────────

function suggestionKey(s: Suggestion) {
  if (s.type === "add_item")
    return `add_item:${s.name}:${s.bag_id}:${s.quantity ?? 1}`;
  if (s.type === "add_sub_item")
    return `add_sub_item:${s.item_id}:${s.new_sub_item.name}`;
  return `create_bag:${s.name}`;
}

function SuggestionCards({
  suggestions,
  onAccept,
  onDecline,
  accepting,
}: {
  suggestions: Suggestion[];
  onAccept: (s: Suggestion) => void;
  onDecline: (s: Suggestion) => void;
  accepting: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginTop: "2px",
      }}
    >
      {suggestions.map((s) => {
        const key = suggestionKey(s);
        const isAccepting = accepting === key;
        const isDisabled = accepting !== null;
        const isCreateBag = s.type === "create_bag";
        const isSubItem = s.type === "add_sub_item";

        return (
          <div
            key={key}
            style={{
              background: "var(--card)",
              border: `1px solid ${isCreateBag ? "rgba(74,123,181,0.3)" : isSubItem ? "rgba(120,180,120,0.35)" : "var(--border)"}`,
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "13px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                {isCreateBag ? (
                  <>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "var(--primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginRight: "6px",
                      }}
                    >
                      New bag
                    </span>
                    <span
                      style={{ fontWeight: 600, color: "var(--foreground)" }}
                    >
                      {s.name}
                    </span>
                    <span
                      style={{
                        color: "var(--fg-muted)",
                        fontSize: "11px",
                        marginLeft: "6px",
                      }}
                    >
                      {s.bag_type}
                    </span>
                  </>
                ) : isSubItem ? (
                  <>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "rgb(80,150,80)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginRight: "6px",
                      }}
                    >
                      Variant
                    </span>
                    <span
                      style={{ fontWeight: 600, color: "var(--foreground)" }}
                    >
                      {s.item_name}
                    </span>
                    <span
                      style={{
                        color: "var(--fg-muted)",
                        fontSize: "11px",
                        marginLeft: "4px",
                      }}
                    >
                      + {s.new_sub_item.name}
                    </span>
                    <span
                      style={{
                        color: "var(--fg-muted)",
                        fontSize: "11px",
                        marginLeft: "6px",
                      }}
                    >
                      → {s.bag_name}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      style={{ fontWeight: 600, color: "var(--foreground)" }}
                    >
                      {s.name}
                    </span>
                    {(s.quantity ?? 1) > 1 && (
                      <span
                        style={{
                          color: "var(--fg-muted)",
                          fontSize: "11px",
                          marginLeft: "4px",
                        }}
                      >
                        x{s.quantity}
                      </span>
                    )}
                    <span
                      style={{
                        color: "var(--fg-muted)",
                        fontSize: "11px",
                        marginLeft: "6px",
                      }}
                    >
                      → {s.bag_name}
                    </span>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                <button
                  onClick={() => onAccept(s)}
                  disabled={isDisabled}
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled && !isAccepting ? 0.5 : 1,
                    fontWeight: 500,
                  }}
                >
                  {isAccepting ? "…" : isCreateBag ? "Create" : "Add"}
                </button>
                <button
                  onClick={() => onDecline(s)}
                  disabled={isDisabled}
                  style={{
                    background: "transparent",
                    color: "var(--fg-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            {isCreateBag && s.items.length > 0 && (
              <div
                style={{
                  marginTop: "6px",
                  paddingTop: "6px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>
                  {s.items.join(" · ")}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Chat panel ────────────────────────────────────────────────────────────

function ChatPanel({
  trip,
  session,
  categories,
  onBack,
  onSessionTitleUpdate,
  onClearMessages,
  onDeleteSession,
}: {
  trip: Trip;
  session: ChatSession;
  categories: Category[];
  onBack: () => void;
  onSessionTitleUpdate: (id: number, title: string) => void;
  onClearMessages: (id: number) => void;
  onDeleteSession: (id: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const countdown = useCountdown(rateLimitSeconds, () =>
    setRateLimitSeconds(0),
  );
  const blocked = countdown > 0 || suggestions.length > 0;

  useEffect(() => {
    setMessages([]);
    setSuggestions([]);
    setHistoryLoaded(false);
    api
      .get<ChatMessage[]>(`/chat/sessions/${session.id}/messages`)
      .then((h) =>
        setMessages(h.filter((m) => !m.content.startsWith("[system:"))),
      )
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [session.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, suggestions]);

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || blocked) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);
    const optimistic: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const data = await api.post<{
        reply: string;
        suggestions: Suggestion[];
        history: ChatMessage[];
        session_title?: string;
      }>("/chat", {
        session_id: session.id,
        messages: [{ role: "user", content: text }],
      });
      setMessages(
        data.history.filter((m) => !m.content.startsWith("[system:")),
      );
      if (data.session_title) {
        onSessionTitleUpdate(session.id, data.session_title);
      }
      const seen = new Set<string>();
      setSuggestions(
        (data.suggestions ?? []).filter((s) => {
          const k = suggestionKey(s);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }),
      );
    } catch (e) {
      const err = e as ApiError;
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      if (err.status === 429) setRateLimitSeconds(err.wait_seconds ?? 60);
    } finally {
      setLoading(false);
    }
  }

  function resolveCategory(name?: string): number | undefined {
    if (!name) return undefined;
    return categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
      ?.id;
  }

  async function handleAccept(s: Suggestion) {
    const key = suggestionKey(s);
    setAccepting(key);
    try {
      let confirmation = "";
      if (s.type === "add_item") {
        await api.post(`/bags/${s.bag_id}/items`, {
          name: s.name,
          quantity: s.quantity ?? 1,
          category_id: resolveCategory(s.category) ?? null,
        });
        confirmation = `[system: user accepted — added "${s.name}" (qty ${s.quantity ?? 1}) to bag "${s.bag_name}"]`;
      } else if (s.type === "add_sub_item") {
        if (s.also_convert_original && s.original_name) {
          await api.put(`/items/${s.item_id}`, { name: s.item_name });
          await api.post(`/items/${s.item_id}/sub-items`, {
            name: s.original_name,
            quantity: 1,
          });
        }
        await api.post(`/items/${s.item_id}/sub-items`, {
          name: s.new_sub_item.name,
          quantity: s.new_sub_item.quantity,
        });
        confirmation = `[system: user accepted — added variant "${s.new_sub_item.name}" to item "${s.item_name}" in bag "${s.bag_name}"]`;
      } else {
        const bag = await api.post<{ id: number }>("/bags", {
          name: s.name,
          type: s.bag_type,
        });
        await api.post(`/trips/${trip.id}/bags`, { bag_id: bag.id });
        if (s.items.length > 0) {
          await Promise.all(
            s.items.map((name) =>
              api.post(`/bags/${bag.id}/items`, { name, quantity: 1 }),
            ),
          );
        }
        confirmation = `[system: user accepted — created bag "${s.name}" (${s.bag_type}) with items: ${s.items.join(", ")}]`;
      }
      setSuggestions((prev) => prev.filter((p) => suggestionKey(p) !== key));
      setTimeout(
        () => window.dispatchEvent(new CustomEvent("chat:bag-mutated")),
        100,
      );
      api
        .post("/chat/log", { session_id: session.id, content: confirmation })
        .catch(() => {});
    } catch {
      /* silent */
    } finally {
      setAccepting(null);
    }
  }

  function handleDecline(s: Suggestion) {
    setSuggestions((prev) =>
      prev.filter((p) => suggestionKey(p) !== suggestionKey(s)),
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleClear() {
    setMenuOpen(false);
    try {
      await api.delete(`/chat/sessions/${session.id}/messages`);
      setMessages([]);
      setSuggestions([]);
      onClearMessages(session.id);
    } catch {
      /* silent */
    }
  }

  const sessionTitle = session.title ?? "New chat";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            fontSize: "16px",
            padding: "2px 6px 2px 0",
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sessionTitle}
          </div>
          <div style={{ fontSize: "11px", color: "var(--fg-muted)" }}>
            {trip.name}
          </div>
        </div>
        {/* Session menu */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              fontSize: "16px",
              padding: "4px 6px",
              lineHeight: 1,
              borderRadius: "6px",
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "28px",
                  zIndex: 20,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  boxShadow: "var(--shadow-md)",
                  minWidth: "140px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={handleClear}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: "13px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--foreground)",
                  }}
                >
                  Clear messages
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDeleteSession(session.id); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: "13px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--destructive)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  Delete chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "12px 0 8px",
        }}
      >
        {!historyLoaded && (
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            Loading…
          </p>
        )}
        {historyLoaded && messages.length === 0 && (
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "13px",
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            Ask me anything about packing for this trip.
          </p>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px 16px 16px 4px",
                padding: "10px 16px",
                fontSize: "18px",
                color: "var(--fg-muted)",
                letterSpacing: "3px",
              }}
            >
              ···
            </div>
          </div>
        )}
        {suggestions.length > 0 && (
          <SuggestionCards
            suggestions={suggestions}
            onAccept={handleAccept}
            onDecline={handleDecline}
            accepting={accepting}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Rate limit banner */}
      {countdown > 0 && (
        <div
          style={{
            background: "rgba(232,48,74,0.08)",
            border: "1px solid rgba(232,48,74,0.2)",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12px",
            color: "var(--destructive)",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span>Límite alcanzado. Podés continuar en</span>
          <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {formatTime(countdown)}
          </span>
        </div>
      )}

      {suggestions.length > 0 && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--fg-muted)",
            textAlign: "center",
            margin: "0 0 6px",
            flexShrink: 0,
          }}
        >
          Respondé las sugerencias para continuar
        </p>
      )}

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            blocked ? "Esperá para continuar…" : "Preguntá algo sobre tu viaje…"
          }
          disabled={loading || blocked}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            color: "var(--foreground)",
            fontSize: "13px",
            padding: "10px 12px",
            fontFamily: "inherit",
            lineHeight: "1.5",
            outline: "none",
            opacity: blocked ? 0.5 : 1,
            transition: "border-color 150ms",
            overflow: "hidden",
            minHeight: "40px",
            maxHeight: "120px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading || blocked}
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "16px",
            lineHeight: 1,
            cursor:
              !input.trim() || loading || blocked ? "not-allowed" : "pointer",
            opacity: !input.trim() || loading || blocked ? 0.4 : 1,
            flexShrink: 0,
            transition: "opacity 150ms",
            alignSelf: "flex-end",
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── ChatWindow (main export) ──────────────────────────────────────────────

export function ChatWindow() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("popup");
  const [view, setView] = useState<View>("sessions");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null,
  );

  useEffect(() => {
    api
      .get<Trip[]>("/trips")
      .then((t) => {
        setTrips(t);
        setTripsLoaded(true);
      })
      .catch(() => setTripsLoaded(true));
    api
      .get<Category[]>("/categories")
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Pre-select trip when opening based on current route
  useEffect(() => {
    if (!open || !tripsLoaded) return;
    const tripIdFromPath = extractTripIdFromPath(pathname);
    if (tripIdFromPath) {
      const match = trips.find((t) => t.id === tripIdFromPath);
      if (match && (!selectedTrip || selectedTrip.id !== match.id)) {
        setSelectedTrip(match);
        setSelectedSession(null);
        setView("sessions");
        return;
      }
    }
    const active = trips.find((t) => t.is_active);
    if (active && !selectedTrip) setSelectedTrip(active);
  }, [open, pathname, trips, tripsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load sessions when a trip is selected
  useEffect(() => {
    if (!selectedTrip) return;
    setSessionsLoading(true);
    setSessions([]);
    api
      .get<ChatSession[]>(`/chat/sessions?trip_id=${selectedTrip.id}`)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [selectedTrip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateSession() {
    if (!selectedTrip) return;
    try {
      const s = await api.post<ChatSession>("/chat/sessions", {
        trip_id: selectedTrip.id,
      });
      setSessions((prev) => [s, ...prev]);
      setSelectedSession(s);
      setView("chat");
    } catch {
      /* silent */
    }
  }

  function handleSelectSession(s: ChatSession) {
    setSelectedSession(s);
    setView("chat");
  }

  function handleSessionTitleUpdate(id: number, title: string) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
    setSelectedSession((prev) => (prev?.id === id ? { ...prev, title } : prev));
  }

  function handleClearMessages(id: number) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, title: null, message_count: 0 } : s,
      ),
    );
    setSelectedSession((prev) =>
      prev?.id === id ? { ...prev, title: null, message_count: 0 } : prev,
    );
  }

  async function handleDeleteSession(id: number) {
    try {
      await api.delete(`/chat/sessions/${id}`)
    } catch { /* silent */ }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setSelectedSession(null);
    setView("sessions");
  }

  function handleSelectTrip(t: Trip) {
    setSelectedTrip(t);
    setSelectedSession(null);
    setView("sessions");
  }

  function handleBackToTrips() {
    setSelectedTrip(null);
    setSelectedSession(null);
    setView("sessions");
  }

  function handleBackToSessions() {
    setSelectedSession(null);
    setView("sessions");
  }

  function toggleOpen() {
    setOpen((o) => !o);
    if (!open) setMode("popup");
  }

  function toggleFullscreen() {
    setMode((m) => (m === "popup" ? "fullscreen" : "popup"));
  }

  const windowStyle: React.CSSProperties =
    mode === "fullscreen"
      ? {
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "var(--card)",
          display: "flex",
          flexDirection: "column",
        }
      : {
          position: "fixed",
          bottom: "80px",
          right: "20px",
          zIndex: 1000,
          width: "380px",
          height: "520px",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        };

  return (
    <>
      <button
        onClick={toggleOpen}
        aria-label="Open packing assistant"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1001,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--primary)",
          color: "var(--primary-foreground)",
          border: "none",
          fontSize: "22px",
          cursor: "pointer",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 150ms, box-shadow 150ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.07)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div style={windowStyle}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: mode === "fullscreen" ? "16px 20px" : "12px 16px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
              background: "var(--card)",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              Packing assistant
            </span>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                onClick={toggleFullscreen}
                title={mode === "popup" ? "Expand" : "Minimize"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                  fontSize: "14px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  lineHeight: 1,
                }}
              >
                {mode === "popup" ? "⤢" : "⤡"}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                  fontSize: "18px",
                  padding: "4px 6px",
                  borderRadius: "6px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: mode === "fullscreen" ? "16px 20px" : "12px 16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {!tripsLoaded ? (
              <p
                style={{
                  color: "var(--fg-muted)",
                  fontSize: "13px",
                  textAlign: "center",
                  paddingTop: "32px",
                }}
              >
                Loading…
              </p>
            ) : !selectedTrip ? (
              <TripSelector trips={trips} onSelect={handleSelectTrip} />
            ) : view === "sessions" || !selectedSession ? (
              <SessionList
                trip={selectedTrip}
                sessions={sessions}
                onSelect={handleSelectSession}
                onCreate={handleCreateSession}
                onBack={handleBackToTrips}
                onDelete={handleDeleteSession}
                loading={sessionsLoading}
              />
            ) : (
              <ChatPanel
                trip={selectedTrip}
                session={selectedSession}
                categories={categories}
                onBack={handleBackToSessions}
                onSessionTitleUpdate={handleSessionTitleUpdate}
                onClearMessages={handleClearMessages}
                onDeleteSession={handleDeleteSession}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
