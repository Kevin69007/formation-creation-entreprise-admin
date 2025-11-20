import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

// Exemple d'utilisation combinée de Prisma et Supabase
export async function GET() {
  try {
    // Exemple avec Prisma
    const usersFromPrisma = await prisma.user.findMany({
      take: 5,
    })

    // Exemple avec Supabase (si vous avez des tables dans Supabase)
    // const { data: usersFromSupabase, error } = await supabase
    //   .from('users')
    //   .select('*')
    //   .limit(5)

    return NextResponse.json({
      message: 'Exemple de route API',
      prisma: {
        users: usersFromPrisma,
      },
      // supabase: {
      //   users: usersFromSupabase,
      //   error: error?.message,
      // },
    })
  } catch (error) {
    console.error('Error in example route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

