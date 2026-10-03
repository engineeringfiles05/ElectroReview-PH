import type {Metadata} from 'next';
import './globals.css'; // Global styles
import 'katex/dist/katex.min.css'; // Mathematical rendering styles

export const metadata: Metadata = {
  title: 'ElectroReview PH — Your Partner in REE & RME Board Exam Preparation',
  description: 'Your premier partner in REE & RME Board Exam Preparation. An intelligent review generator that automatically extracts questions, tables, and images from PDF and Word documents to create interactive licensure quizzes with step-by-step whiteboard derivations.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ElectroReview PH — Your Partner in REE & RME Board Exam Preparation',
    description: 'Your premier partner in REE & RME Board Exam Preparation. An intelligent review generator that automatically extracts questions, tables, and images from PDF and Word documents to create interactive licensure quizzes with step-by-step whiteboard derivations.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  // Suppress benign resource/DOM/WebSocket errors that serialize as {"isTrusted":true}
                  if (event && !event.error && (event.target instanceof HTMLElement || event.target instanceof WebSocket || event.isTrusted)) {
                    event.stopImmediatePropagation && event.stopImmediatePropagation();
                    event.preventDefault && event.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(event) {
                  if (event && event.reason && (event.reason instanceof Event || event.reason.isTrusted)) {
                    event.stopImmediatePropagation && event.stopImmediatePropagation();
                    event.preventDefault && event.preventDefault();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
