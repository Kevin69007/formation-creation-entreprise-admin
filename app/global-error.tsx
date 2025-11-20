'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Une erreur s'est produite</h1>
          <p>{error.message || 'Erreur inconnue'}</p>
          <button onClick={reset}>Réessayer</button>
        </div>
      </body>
    </html>
  )
}

