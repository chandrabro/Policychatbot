"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { embedOne, type ModelProgress } from "@/lib/embeddingModel";

type Source = { fileName: string; pageNumber?: number; blobUrl?: string };
type Message = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  isError?: boolean;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<string | null>(null);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    setModelStatus("Loading free AI model…");

    try {
      const embedding = await embedOne(question, (p: ModelProgress) => {
        if (p.status === "progress" && typeof p.progress === "number") {
          setModelStatus(`Downloading AI model… ${Math.round(p.progress)}%`);
        } else {
          setModelStatus("Searching the policies…");
        }
      });
      setModelStatus("Searching the policies…");

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, embedding }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: e.message, isError: true },
      ]);
    } finally {
      setLoading(false);
      setModelStatus(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto flex h-screen max-w-3xl flex-col px-6">
      <header className="flex items-center justify-between border-b border-line py-5">
        <div>
          <h1 className="font-display text-2xl text-ink">Policy Assistant</h1>
          <p className="text-sm text-mute">Answers are sourced from company policy documents.</p>
        </div>
        <button onClick={logout} className="text-sm text-mute hover:text-ink">
          Sign out
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto py-6">
        {messages.length === 0 && (
          <p className="rounded-lg border border-line bg-panel p-4 text-sm text-mute">
            Ask something like "How many sick days do I get?" or "What's the
            policy on remote work?" — answers come only from the uploaded
            policy documents, with the exact page cited. The first question
            downloads a small free AI model (~90MB, cached after that).
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-4 py-3 text-left ${
                m.role === "user"
                  ? "bg-navy text-white"
                  : m.isError
                  ? "border border-amber/40 bg-amber-light text-amber"
                  : "border border-line bg-panel text-ink"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {m.sources.map((s, j) => (
                    <a
                      key={j}
                      href={s.blobUrl ? `${s.blobUrl}#page=${s.pageNumber ?? 1}` : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        s.blobUrl
                          ? "border-amber/40 bg-amber-light text-amber hover:bg-amber/20"
                          : "cursor-default border-line text-mute"
                      }`}
                    >
                      {s.fileName}
                      {s.pageNumber ? ` — p.${s.pageNumber}` : ""}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="inline-block rounded-lg border border-line bg-panel px-4 py-3 text-mute">
            {modelStatus || "Searching the policies…"}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-line py-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask about a policy…"
          className="flex-1 rounded-md border border-line bg-panel px-4 py-2.5 text-ink outline-none focus:border-navy"
        />
        <button
          onClick={ask}
          disabled={loading || !input.trim()}
          className="rounded-md bg-navy px-5 py-2.5 font-medium text-white transition hover:bg-navy-dark disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </main>
  );
}
