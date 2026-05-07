import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'FinTrack Pro — AI Finance Manager',
  description: 'Intelligent personal finance management powered by AI agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161b27',
              color: '#e2e8f0',
              border: '1px solid #1e2535',
              borderRadius: '12px',
              fontFamily: 'Sora, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f1117' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f1117' } },
          }}
        />
      </body>
    </html>
  )
}
