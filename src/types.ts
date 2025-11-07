// Définit la structure de nos données Technicien
// Inclut 'id' qui est nécessaire pour les mises à jour (UPDATE) et suppressions (DELETE)
export interface Technicien {
  id: number; // L'ID auto-généré par Supabase
  nom_technicien: string;
  email_technicien: string | null;
  telephone_technicien: string | null;
  region: string | null;
  resp_exploitation_email: string | null;
  resp_exploitation_tel: string | null;
  resp_tech_email: string | null;
  resp_tech_tel: string | null;
  code_technicien: string; // Le champ de recherche
}