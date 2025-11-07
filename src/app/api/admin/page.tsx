'use client';

import React, { useState, useEffect } from 'react';
import { Technicien } from '@/types'; // Utilise notre type partagé
import { Plus, Edit, Trash2, Save, XCircle, Loader2, Home, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Noms de colonnes lisibles pour le formulaire
const columnNames: Array<keyof Technicien> = [
  'code_technicien', 'nom_technicien', 'region', 
  'email_technicien', 'telephone_technicien',
  'resp_tech_email', 'resp_tech_tel',
  'resp_exploitation_email', 'resp_exploitation_tel'
];

// État initial pour un nouveau technicien
const initialState: Partial<Technicien> = {
  code_technicien: '',
  nom_technicien: '',
  region: '',
  email_technicien: '',
  telephone_technicien: '',
  resp_tech_email: '',
  resp_tech_tel: '',
  resp_exploitation_email: '',
  resp_exploitation_tel: '',
};

const AdminPage = () => {
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 'editingId' suivra l'ID du technicien en cours d'édition
  const [editingId, setEditingId] = useState<number | null>(null); 
  
  // 'formData' contiendra les données du formulaire (soit pour la création, soit pour l'édition)
  const [formData, setFormData] = useState<Partial<Technicien>>(initialState);
  
  const [isCreating, setIsCreating] = useState(false); // État pour afficher/masquer le formulaire de création
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // --- 1. FONCTIONS DE RÉCUPÉRATION ET DÉCONNEXION ---

  // Charge tous les techniciens au démarrage
  const fetchTechniciens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/techniciens');
      if (!response.ok) {
        throw new Error('Échec de la récupération des données. Assurez-vous d\'être admin.');
      }
      const data: Technicien[] = await response.json();
      // Tri côté client par code_technicien
      data.sort((a, b) => a.code_technicien.localeCompare(b.code_technicien));
      setTechniciens(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechniciens();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // --- 2. FONCTIONS DE GESTION DU FORMULAIRE ---

  // Gère les changements dans les inputs du formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Annule le mode création ou édition
  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData(initialState);
    setError(null);
  };

  // Passe une ligne en mode "édition"
  const startEditing = (tech: Technicien) => {
    setEditingId(tech.id);
    setFormData(tech); // Pré-remplit le formulaire avec les données actuelles
    setIsCreating(false);
  };

  // --- 3. FONCTIONS API (CRUD) ---

  // Gère la soumission (Création ou Mise à jour)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code_technicien || !formData.nom_technicien) {
      setError('Le code technicien et le nom sont requis.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let response;
      if (editingId) {
        // --- MISE À JOUR (PUT) ---
        response = await fetch(`/api/admin/techniciens/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // --- CRÉATION (POST) ---
        response = await fetch('/api/admin/techniciens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'L\'opération a échoué.');
      }

      const updatedTechnicien: Technicien = await response.json();

      if (editingId) {
        // Remplacer l'ancien objet dans l'état local
        setTechniciens(prev => 
          prev.map(t => (t.id === editingId ? updatedTechnicien : t))
        );
      } else {
        // Ajouter le nouvel objet à l'état local
        setTechniciens(prev => [...prev, updatedTechnicien]);
      }
      cancelEdit(); // Réinitialise le formulaire
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gère la suppression
  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce technicien ?')) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/techniciens/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'La suppression a échoué.');
      }

      // Retirer l'objet de l'état local
      setTechniciens(prev => prev.filter(t => t.id !== id));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // --- 4. RENDER ---

  if (loading && techniciens.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      {/* Entête */}
      <header className="w-full max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Panneau Administrateur
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <Home className="h-4 w-4 mr-2" />
            Accueil (Recherche)
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Bouton Créer / Formulaire */}
      <div className="w-full max-w-7xl mx-auto mb-6">
        {!isCreating && !editingId && (
          <button
            onClick={() => { setIsCreating(true); setFormData(initialState); }}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter un Technicien
          </button>
        )}

        {/* Formulaire (pour Création ou Édition) */}
        {(isCreating || editingId) && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Modifier le Technicien' : 'Nouveau Technicien'}
            </h2>
            
            {/* Grille pour les champs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {columnNames.map((key) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                    {(key === 'code_technicien' || key === 'nom_technicien') && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    id={key}
                    name={key}
                    value={formData[key as keyof Technicien] || ''}
                    onChange={handleFormChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={key.replace(/_/g, ' ')}
                  />
                </div>
              ))}
            </div>

            {/* Boutons de soumission */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-V mr-2" />}
                {editingId ? 'Sauvegarder' : 'Créer'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="w-full max-w-7xl mx-auto mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Table des Techniciens */}
      <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code Tech</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {techniciens.map((tech) => (
              <tr key={tech.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{tech.code_technicien}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tech.nom_technicien}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tech.region}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tech.email_technicien}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tech.telephone_technicien}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => startEditing(tech)}
                    disabled={loading}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-full disabled:text-gray-400"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tech.id)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full disabled:text-gray-400"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;