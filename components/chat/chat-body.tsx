import React from 'react'
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';

interface ChatBodyProps {
    messages: {
        id: string;
        role: string;
        content: string;
    }[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatBody = ({ messages, isLoading, messagesEndRef }: ChatBodyProps) => {

    return (
        <ScrollArea className="flex-1 px-4 py-6 space-y-4 h-[calc(100vh-10rem)] ">
            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full flex-1">
                    <div className="text-center">
                        <p className="text-accent-foreground/80 text-lg font-semibold">Hello, How can I help you?</p>
                    </div>
                </div>
            )}

            {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                    message.content && <div
                        key={message.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${isUser
                                ? "bg-blue-500 text-white"
                                : "bg-white/90 backdrop-blur-sm text-gray-800"
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                {message.content}
                            </p>
                        </div>
                    </div>
                );
            })}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </ScrollArea>
    )
}

export default ChatBody