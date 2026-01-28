import React from "react";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function AiChatPage() {
  const [messages, setMessages] = React.useState([
    {
      id: 0,
      role: "assistant",
      content:
        "Hi! I’m your Smart Pantry assistant. Ask me how to use up ingredients, plan meals, or turn leftovers into fertilizer.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [
      ...messages,
      { id: messages.length, role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          role: "assistant",
          content: data.reply ?? "Sorry, I couldn’t generate a response.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          role: "assistant",
          content:
            "I ran into a problem talking to Gemini. Please check your GEMINI_API_KEY and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col bg-slate-100 text-slate-900`}
    >
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              AI assistant
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Smart Pantry chat
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Ask anything about using up ingredients, planning meals, and reducing food waste.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Conversation
          </div>
          <div className="flex h-[420px] flex-col gap-3 overflow-y-auto pr-1 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    m.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-900 border border-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="sr-only" htmlFor="chat-input">
                Ask a question
              </label>
              <textarea
                id="chat-input"
                rows={2}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-400"
                placeholder="E.g. “I have leftover spinach, rice and chicken. What can I cook tonight?”"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Thinking…" : "Send"}
            </button>
          </form>

          <p className="mt-2 text-[11px] text-slate-400">
            Powered by Gemini. Responses may be inaccurate; always use your own judgement for food
            safety.
          </p>
        </div>
      </main>
    </div>
  );
}

