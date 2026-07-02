import { PlusIcon, RadioIcon, SendIcon } from 'lucide-react'
import React from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button';
import { ChatType } from '@/types/chat';

interface ChatInputProps {
    isLoading: boolean;
    input: string;
    chatType: ChatType | (string);

    handleSubmit: (e: React.FormEvent) => void;
    setInput: (input: string) => void;
    setChatType: (type: ChatType) => void;

}

const ChatInput = ({ handleSubmit, isLoading, input, setInput }: ChatInputProps) => {
    return (
        <div className="p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Button
                    type="button"
                    variant={"secondary"}
                    className='cursor-pointer shadow-lg rounded-full size-12 p-3.5 dark:bg-[#1e2b3c]'
                >
                    <PlusIcon className="size-8" />
                </Button>

                <div className='flex items-center bg-card dark:bg-[#1e2b3c] text-card-foreground border border-border shadow-lg rounded-full p-2 flex-1'>
                    <Input onChange={(e) => setInput(e.target.value)} value={input} className='bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground' placeholder='Chat here...' />
                    <section className='flex items-center gap-2'>
                        {input ? (
                            <Button
                                type="submit"
                                size={"icon"}
                                disabled={isLoading}
                                className='cursor-pointer shadow-lg rounded-full size-10 p-2.5 dark:bg-green-500 dark:text-white'
                            >
                                <SendIcon className="size-8" />
                            </Button>
                        ) : <Button
                            type="button"
                            size={"icon"}
                            className='cursor-pointer shadow-lg rounded-full size-10 p-2.5 dark:bg-green-600 dark:text-white'
                        >
                            <RadioIcon className="size-8" />
                        </Button>}
                    </section>
                </div>

            </form>
        </div>
    )
}

export default ChatInput
