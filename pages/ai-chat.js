import React from "react";
import { DM_Sans } from "next/font/google";
import { Card, CardBody, Button } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AiChatPage() {
  const { profile, isAuthenticated } = useAuth();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [messages, setMessages] = React.useState([
    {
      id: 0,
      role: "assistant",
      content:
        "Hi! I'm your Smart Pantry assistant. Ask me how to use up ingredients, plan meals, or turn leftovers into fertilizer.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef(null);

  const quickPrompts = [
    "Give me dinner ideas with the ingredients I already have.",
    "Plan a 3‑day meal plan using what’s in my pantry.",
    "Help me turn these leftovers into something new.",
    "How can I reduce food waste this week?",
  ];

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
      className={`${dmSans.className} flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-teal-50 text-slate-900`}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white shadow-sm">
            SP
          </div>
          <span className="text-sm font-medium tracking-tight text-slate-800">
            Smart Pantry
          </span>
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          M
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-2">
        <div className="w-full max-w-5xl space-y-8">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
              AI assistant
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {greeting}
              {profile?.name ? `, ${profile.name}.` : "."}
              <br />
              Can I help you with anything?
            </h1>
            <p className="max-w-xl text-sm text-slate-500">
              Choose a prompt below or ask your own question to get ideas for meals, pantry
              planning, and reducing food waste.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  className="group inline-flex items-center rounded-full border border-emerald-100 bg-white/70 px-4 py-2 text-xs text-slate-700 shadow-sm backdrop-blur transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:bg-emerald-500" />
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          <Card shadow="sm" className="border-none bg-white/70 backdrop-blur-md">
            <CardBody className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex-1 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <span>Conversation</span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-emerald-600">
                    Gemini · Smart Pantry
                  </span>
                </div>
                <div className="flex h-[260px] flex-col gap-3 overflow-y-auto pr-1 text-sm sm:h-[320px]">
                  {messages.length === 1 ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Ask your first question to get started.
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            m.role === "user"
                              ? "bg-slate-900 text-white"
                              : "border border-slate-100 bg-white/80 text-slate-900 shadow-sm"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>How can Smart Pantry help you today?</span>
                  <span>
                    Model: <span className="font-medium text-slate-600">Gemini 2.5</span>
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="sr-only" htmlFor="chat-input">
                      Ask a question
                    </label>
                    <textarea
                      id="chat-input"
                      ref={inputRef}
                      rows={2}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="E.g. “I have leftover spinach, rice and chicken. What can I cook tonight?”"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    isDisabled={loading}
                    className="h-11 rounded-full bg-slate-900 px-5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    {loading ? "Thinking…" : "Send"}
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Powered by Gemini. Responses may be inaccurate; always use your own judgement for
                  food safety.
                </p>
              </form>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}


