'use client';

import React, { useState, useEffect } from 'react';
import { Technicien } from '@/types'; // Utilise notre type partagé
// CORRECTION: Remplacement de ShieldWarning par ShieldAlert
import { Plus, Edit, Trash2, Save, XCircle, Loader2, Home, LogOut, AlertTriangle, ShieldAlert } from 'lucide-react';
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

// --- Composant Modal de Confirmation ---
const ConfirmationModal = ({
  isOpen,
  onCancel,
  onConfirm,
  message,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex items-center">
          {/* CORRECTION: Utilisation de ShieldAlert */}
          <ShieldAlert className="h-10 w-10 text-red-500 mr-3" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Confirmation Requise</h2>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Confirmer la Suppression
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Page Admin ---
const AdminPage = () => {
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [formData, setFormData] = useState<Partial<Technicien>>(initialState);
  const [isCreating, setIsCreating] = useState(false); 
  
  // État pour la modale de suppression
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false); // Loader pour le formulaire

  const router = useRouter();
  const supabase = createClientComponentClient();

  // --- 1. FONCTIONS DE RÉCUPÉRATION ET DÉCONNEXION ---

  const fetchTechniciens = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/techniciens');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Échec de la récupération des données. Assurez-vous d\'être admin.');
      }
      const data: Technicien[] = await response.json();
      data.sort((a, b) => (a.code_technicien || '').localeCompare(b.code_technicien || ''));
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData(initialState);
    setError(null);
  };

  const startEditing = (tech: Technicien) => {
    setEditingId(tech.id);
    setFormData(tech); 
    setIsCreating(false);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // --- 3. FONCTIONS API (CRUD) ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code_technicien || !formData.nom_technicien) {
      setError('Le code technicien et le nom sont requis.');
      return;
    }
    setSubmitLoading(true);
    setError(null);

    try {
      let response;
      let url = '/api/admin/techniciens';
      let method = 'POST';

      if (editingId) {
        url = `/api/admin/techniciens/${editingId}`;
        method = 'PUT';
      }

      response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'L\'opération a échoué.');
      }

      const updatedTechnicien: Technicien = await response.json();

      if (editingId) {
        setTechniciens(prev => 
          prev.map(t => (t.id === editingId ? updatedTechnicien : t))
            .sort((a, b) => (a.code_technicien || '').localeCompare(b.code_technicien || ''))
        );
      } else {
        setTechniciens(prev => 
          [...prev, updatedTechnicien]
            .sort((a, b) => (a.code_technicien || '').localeCompare(b.code_technicien || ''))
        );
      }
      cancelEdit(); 
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Ouvre la modale de confirmation
  const startDelete = (id: number) => {
    setDeletingId(id);
  };

  // Confirme et exécute la suppression
  const confirmDelete = async () => {
    if (deletingId === null) return;
    
    setError(null);

    try {
      const response = await fetch(`/api/admin/techniciens/${deletingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'La suppression a échoué.');
      }

      setTechniciens(prev => prev.filter(t => t.id !== deletingId));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null); // Ferme la modale
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
    <>
      <ConfirmationModal 
        isOpen={deletingId !== null}
        onCancel={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        message="Êtes-vous sûr de vouloir supprimer ce technicien ? Cette action est irréversible."
      />
      
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
              onClick={() => { setIsCreating(true); setFormData(initialState); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                {editingId ? `Modifier: ${formData.nom_technicien}` : 'Nouveau Technicien'}
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
                  disabled={submitLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {submitLoading ? (
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" /> 
                  )}
                  {editingId ? 'Sauvegarder' : 'Créer'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="w-full max-w-7xl mx-auto mb-4 p-4 flex items-start bg-red-100 text-red-700 border border-red-300 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
            <p className="font-medium"><strong>Erreur:</strong> {error}</p>
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
                      disabled={submitLoading || (editingId === tech.id)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-full disabled:text-gray-400 disabled:bg-transparent"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startDelete(tech.id)}
                      disabled={submitLoading}
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
    </>
  );
};

export default AdminPage;
