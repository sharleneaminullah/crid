import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { calculateReadinessScore, topSkillGaps } from "@/lib/scoring";
import { useProfileStore } from "@/store/profileStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const STARTER_PROMPTS = [
  "Where should I focus first?",
  "How do I explain my career break in interviews?",
  "Am I ready to start applying?",
  "What projects would impress hiring managers?",
];

export function CareerCoach() {
  const { targetRole, experienceYears } = useProfileStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const projects = useLiveQuery(() => db.projects.toArray(), [], []);
  const analyses = useLiveQuery(
    () => db.skillAnalyses.orderBy("generatedAt").reverse().limit(1).toArray(),
    [],
    [],
  );

  const latestSkills = analyses[0]?.skills ?? [];
  const readinessScore = calculateReadinessScore(latestSkills, projects);
  const gapNames = topSkillGaps(latestSkills, 5).map((s) => s.name);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        context: {
          targetRole,
          experienceYears,
          readinessScore,
          topSkillGaps: gapNames,
        },
      },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void sendMessage({ text });
  }

  function handleStarterClick(prompt: string) {
    setInput(prompt);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <h1 className="text-xl font-bold">AI Career Coach</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Context-aware coaching for your{" "}
          <span className="font-medium text-foreground">{targetRole}</span>{" "}
          journey ·{" "}
          <span className="text-primary font-medium">
            {readinessScore}% ready
          </span>
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center space-y-6"
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Your AI Career Coach</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                I know your skill gaps, your target role, and your readiness
                score. Ask me anything about your return-to-work journey.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleStarterClick(prompt)}
                  className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const textPart = msg.parts.find((p) => p.type === "text");
              const text = textPart?.type === "text" ? textPart.text : "";

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", isUser && "flex-row-reverse")}
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isUser ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm",
                    )}
                  >
                    {text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="px-6 py-4 border-t shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask your career coach anything…"
            disabled={isLoading}
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
