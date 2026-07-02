import Image from 'next/image'
import { Button } from '../ui/button'
import { XIcon } from 'lucide-react'

interface ChatHeaderProps {
    onClose?: () => void;
}

const ChatHeader = ({ onClose }: ChatHeaderProps) => {
    return (
        <div className="flex items-center justify-between bg-card text-card-foreground p-2 border-b border-border">
            {/* Logo */}
            <div className='flex items-center gap-5'>
                <figure className='bg-white shadow-lg p-2 rounded-full flex items-center justify-center'>
                    <Image src="https://demoste.champslms.com/uploads/system/100-st-engineering-logo-1770120367567.png" alt="Logo" width={40} height={40} className='object-contain' />
                </figure>

                <section className='flex gap-4 items-center flex-wrap'>
                    <div>
                        <h5 className='text-lg font-semibold'>
                            EnterpriseLMS
                        </h5>
                        <p className='text-xs text-muted-foreground font-medium'>
                            Digital chatbot interface.
                        </p>
                    </div>


                </section>
            </div>

            <Button
                size={"icon"}
                variant="secondary"
                className='rounded-full size-8'
                onClick={onClose}
            >
                <XIcon className='w-4 h-4' />
            </Button>
        </div>
    )
}

export default ChatHeader