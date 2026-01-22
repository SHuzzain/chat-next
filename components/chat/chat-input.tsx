import { MicIcon, PlusIcon, RadioIcon, SendIcon } from 'lucide-react'
import React  from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button';

interface ChatInputProps {
    handleSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    input: string;
    setInput: (input: string) => void;
}

const ChatInput = ({ handleSubmit, isLoading, input, setInput }: ChatInputProps) => {
    return (
        <div className="p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Button
                    type="button"
                    variant={"secondary"}
                    className='cursor-pointer shadow-lg rounded-full size-12 p-3.5'
                >
                    <PlusIcon className="size-8" />
                </Button>

                <div className='flex items-center bg-white rounded-full p-2 flex-1'>
                    <Input onChange={(e) => setInput(e.target.value)} value={input} className='bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0' placeholder='Chat here...' />
                    <section className='flex items-center gap-2'>
                        <Button
                            type="button"
                            size={"icon"}
                            variant={"secondary"}
                            className='cursor-pointer shadow-lg rounded-full size-10 p-2.5'
                        >
                            <MicIcon className="size-8" />
                        </Button>

                        {input ? (
                            <Button
                                type="submit"
                                size={"icon"}
                                disabled={isLoading}
                                className='cursor-pointer shadow-lg rounded-full size-10 p-2.5'
                            >
                                <SendIcon className="size-8" />
                            </Button>
                        ) : <Button
                            type="button"
                            size={"icon"}
                            className='cursor-pointer shadow-lg rounded-full size-10 p-2.5'
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