import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// Initialisation du client Supabase (utilisant la clé publique)
const supabase = getSupabaseClient();

/**
 * Endpoint de recherche par 'code_technicien'.
 * URL: /api/search?code=XYZ
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codeTechnicien = searchParams.get('code');

    if (!codeTechnicien) {
      return NextResponse.json({ error: 'Le paramètre "code" est manquant.' }, { status: 400 });
    }

    // Requête Supabase : Sélection de TOUS les champs de contact
    const { data: techniciens, error } = await supabase
      .from('techniciens')
      .select(`
        nom_technicien, 
        email_technicien, 
        telephone_technicien, 
        region,
        resp_exploitation_email,
        resp_exploitation_tel,
        resp_tech_email,
        resp_tech_tel
      `)
      // Le champ de recherche est 'code_technicien'
      .eq('code_technicien', codeTechnicien.toUpperCase().trim()) 
      .limit(50); 

    if (error) {
      console.error('Erreur Supabase lors de la recherche:', error);
      return NextResponse.json({ error: `Erreur DB: ${error.message}. Code: ${error.code}` }, { status: 500 });
    }

    return NextResponse.json(techniciens);

  } catch (err) {
    console.error('Erreur inattendue dans l\'API de recherche:', err);
    return NextResponse.json({ error: 'Erreur serveur inattendue.' }, { status: 500 });
  }
}