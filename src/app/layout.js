import './globals.css'

export const metadata = {
  title: 'X Wrapped 2024',
  description: 'Your Twitter Year in Review',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-blue-900 via-black to-purple-900">
        {children}
      </body>
    </html>
  )
}