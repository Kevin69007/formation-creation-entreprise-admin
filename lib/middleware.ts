import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from './auth'

export function requireAuth(request: NextRequest): { userId: string; username: string; role: string } | null {
  const payload = getUserFromRequest(request)
  if (!payload) {
    return null
  }
  return payload
}

export function requireAdmin(request: NextRequest): { userId: string; username: string; role: string } | null {
  const payload = requireAuth(request)
  if (!payload || payload.role !== 'ADMIN') {
    return null
  }
  return payload
}

export function createUnauthorizedResponse(message: string = 'Non autorisé') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function createForbiddenResponse(message: string = 'Accès refusé') {
  return NextResponse.json({ error: message }, { status: 403 })
}

