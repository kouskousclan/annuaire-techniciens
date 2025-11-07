import { NextRequest, NextResponse } from 'next/server';
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

// PUT: Mettre à jour un technicien par son ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  try {
    const payload = await request.json();

    // Filtrer les champs autorisés
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

    const updatedData: Partial<Omit<Technicien, 'id'>> = Object.fromEntries(
      Object.entries(payload).filter(([k]) => (allowedKeys as string[]).includes(k))
    ) as Partial<Omit<Technicien, 'id'>>;

    // Validation minimale si présents
    if (
      'nom_technicien' in updatedData &&
      typeof updatedData.nom_technicien === 'string' &&
      updatedData.nom_technicien.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'nom_technicien ne peut pas être vide' },
        { status: 422 }
      );
    }
    if (
      'code_technicien' in updatedData &&
      typeof updatedData.code_technicien === 'string' &&
      updatedData.code_technicien.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'code_technicien ne peut pas être vide' },
        { status: 422 }
      );
    }

    if (Object.keys(updatedData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide à mettre à jour' },
        { status: 422 }
      );
    }

    const supabaseService = getSupabaseService();
    const { data, error: dbError } = await supabaseService
      .from('techniciens')
      .update(updatedData)
      .eq('id', idNum)
      .select(
        'id, nom_technicien, email_technicien, telephone_technicien, region, resp_exploitation_email, resp_exploitation_tel, resp_tech_email, resp_tech_tel, code_technicien'
      )
      .single();

    if (dbError) {
      console.error('Erreur DB PUT:', dbError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Erreur JSON PUT:', e);
    return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
  }
}

// DELETE: Supprimer un technicien par son ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  const supabaseService = getSupabaseService();
  const { error: dbError } = await supabaseService
    .from('techniciens')
    .delete()
    .eq('id', idNum)
    .select('id')
    .single();

  if (dbError) {
    if ((dbError as any).code === 'PGRST116') {
      return NextResponse.json({ error: 'Technicien introuvable' }, { status: 404 });
    }
    console.error('Erreur DB DELETE:', dbError);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

