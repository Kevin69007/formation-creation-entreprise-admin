'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset?: () => void
}) {
  return (
    <html lang="fr">
      <body>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1>Erreur API</h1>
          <p>{error?.message || 'Erreur inconnue'}</p>
          {reset && typeof reset === 'function' && (
            <button 
              onClick={reset} 
              style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
            >
              Réessayer
            </button>
          )}
        </div>
      </body>
    </html>
  )
}

