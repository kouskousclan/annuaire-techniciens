import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseService } from '@/lib/supabase';
import type { Technicien } from '@/types';

const isAdminUser = (user: any) => {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const userEmail = user.email?.toLowerCase();
  return Boolean(userEmail && adminEmails.includes(userEmail));
};

// GET: Récupérer tous les techniciens
export async function GET(request: Request) {
  // 1. Vérification Admin
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Utiliser app_metadata (contrôlé côté serveur)
  if (!isAdminUser(user)) {
    return NextResponse.json(
      { error: 'Accès interdit. Administrateur requis.' },
      { status: 403 }
    );
  }

  // 2. Logique de l'API
  const supabaseService = getSupabaseService();
  const { data, error: dbError } = await supabaseService
    .from('techniciens')
    .select(
      'id, nom_technicien, email_technicien, telephone_technicien, region, resp_exploitation_email, resp_exploitation_tel, resp_tech_email, resp_tech_tel, code_technicien'
    );

  if (dbError) {
    console.error('Erreur DB GET:', dbError);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Créer un nouveau technicien
export async function POST(request: Request) {
  // 1. Vérification Admin
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json(
      { error: 'Accès interdit. Administrateur requis.' },
      { status: 403 }
    );
  }

  // 2. Logique de l'API
  try {
    const payload = await request.json();

    // Champs autorisés à l'insertion (whitelist)
    const allowedKeys: Array<keyof Omit<Technicien, 'id'>> = [
      'nom_technicien',
      'email_technicien',
      'telephone_technicien',
      'region',
      'resp_exploitation_email',
      'resp_exploitation_tel',
      'resp_tech_email',
      'resp_tech_tel',
      'code_technicien',
    ];

    const newTechnicien: Omit<Technicien, 'id'> = Object.fromEntries(
      Object.entries(payload).filter(([k]) => (allowedKeys as string[]).includes(k))
    ) as Omit<Technicien, 'id'>;

    // Validation minimale
    if (
      !newTechnicien ||
      typeof newTechnicien.nom_technicien !== 'string' ||
      newTechnicien.nom_technicien.trim() === '' ||
      typeof newTechnicien.code_technicien !== 'string' ||
      newTechnicien.code_technicien.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Champs requis manquants: nom_technicien, code_technicien' },
        { status: 422 }
      );
    }

    const supabaseService = getSupabaseService();
    const { data, error: dbError } = await supabaseService
      .from('techniciens')
      .insert(newTechnicien)
      .select(
        'id, nom_technicien, email_technicien, telephone_technicien, region, resp_exploitation_email, resp_exploitation_tel, resp_tech_email, resp_tech_tel, code_technicien'
      )
      .single();

    if (dbError) {
      console.error('Erreur DB POST:', dbError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('Erreur JSON POST:', e);
    return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
  }
}

