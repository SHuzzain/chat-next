import Image from 'next/image'
import React from 'react'
import { Button } from '../ui/button'
import { XIcon } from 'lucide-react'

interface ChatHeaderProps {
    onClose?: () => void;
}

const ChatHeader = ({ onClose }: ChatHeaderProps) => {
    return (
        <div className="flex items-center justify-between  bg-white p-2">
            {/* Logo */}
            <div className='flex items-center gap-5'>
                <figure className='bg-white shadow-lg p-2 rounded-full flex items-center justify-center'>
                    <Image src="/champ.svg" alt="Logo" width={40} height={40} className='object-contain mb-1' />
                </figure>

                <section>
                    <h5 className='text-lg font-semibold'>
                        Mind Champs
                    </h5>
                    <p className='text-xs text-muted-foreground font-medium'>
                        Digital chatbot interface.
                    </p>
                </section>
            </div>

            <Button
                size={"icon"}
                className='rounded-full size-8'
                onClick={onClose}
            >
                <XIcon className='w-4 h-4' />
            </Button>
        </div>
    )
}

export default ChatHeader