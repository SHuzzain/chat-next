"use client";

import {
  useState,
  useEffect,
  useRef,
  use,
  startTransition,
} from "react";

import { ChatBody, ChatHeader, ChatInput } from "@/components/chat";
import { ChatType, Message } from "@/types/chat";
import { chatStream } from "@/actions/chat-stream";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

type EmbedPageProps = {
  searchParams: Promise<{
    token: string;
    origin: string;
  }>;
};

export default function EmbedPage({ searchParams }: EmbedPageProps) {
  const { token, origin } = use(searchParams);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isLoading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(true);
  const [chatType, setChatType] = useState<ChatType>("CHAT");

  // Notify parent window of size changes
  useEffect(() => {
    const notifyParent = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'resize',
          width: isClosed ? '80px' : '350px',
          height: isClosed ? '80px' : '500px'
        }, '*');
      }
    };

    notifyParent();
    window.addEventListener('resize', notifyParent);
    return () => window.removeEventListener('resize', notifyParent);
  }, [isClosed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    startTransition(() => {
      setMessages((prev) => [...prev, userMessage]);
    });
    setInput("");
    const sendMessages = JSON.parse(JSON.stringify([...messages, userMessage]));

    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: null,
      },
    ]);

    try {
      await chatStream({
        chatType,
        messages: sendMessages,
        origin,
        token,
        onChunk: (text, done) => {
          setLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                  ...m,
                  content: text,
                  createdAt: done ? new Date() : m.createdAt,
                }
                : m
            )
          );
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      <AnimatePresence>
        {!isClosed && (
          <motion.div
            initial={{ x: 100, y: 100, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 100, y: 100, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col h-full w-full overflow-hidden bg-slate-300/20 backdrop-blur-sm border-4 rounded-2xl border-white"
          >
            <ChatHeader onClose={() => setIsClosed(true)} />
            <ChatBody messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
            <ChatInput
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              input={input}
              setInput={setInput}
              chatType={chatType}
              setChatType={setChatType}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClosed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center h-full"
          >
            <button
              onClick={() => setIsClosed(false)}
              className="bg-white shadow-lg p-3 rounded-full hover:scale-110 transition-transform"
            >
              <Image src="/champ.svg" width={40} height={40} alt="Chat" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}