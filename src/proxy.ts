import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Correction : La fonction s'appelle maintenant 'proxy' au lieu de 'middleware'
export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Crée un client Supabase pour le proxy (anciennement middleware)
  const supabase = createMiddlewareClient({ req, res });

  // Récupère la session de l'utilisateur
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Si l'utilisateur n'est pas connecté ET n'est pas sur la page de connexion
  if (!session && pathname !== '/login') {
    // Redirige vers la page de connexion
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si l'utilisateur EST connecté ET essaie d'aller sur /login
  if (session && pathname === '/login') {
    // Redirige vers la page d'accueil
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res;
}

// La configuration 'config' reste la même
export const config = {
  matcher: [
    /*
     * Fait correspondre tous les chemins de requête sauf ceux qui commencent par :
     * - api (routes API)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (fichier favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};