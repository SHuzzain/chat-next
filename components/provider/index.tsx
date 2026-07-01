import React from 'react'
import { ThemeProvider } from './theme-provider'

function Provider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
            storageKey="mindchamps-chatbot-theme"
        >
            {children}
        </ThemeProvider>
    )
}

export default Provider