import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get('origin') || '*'
  
  // En développement, autoriser toutes les origines
  // En production, vous devriez restreindre aux origines autorisées
  const allowedOrigin = process.env.NODE_ENV === 'production' 
    ? (origin === 'null' ? '*' : origin) // Gérer les fichiers locaux (file://)
    : '*' // En développement, autoriser toutes les origines

  // Gérer les requêtes OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    
    // Headers CORS
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }

  // Pour les autres requêtes, ajouter les headers CORS
  const response = NextResponse.next()
  
  // Headers CORS
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: '/api/:path*',
}

