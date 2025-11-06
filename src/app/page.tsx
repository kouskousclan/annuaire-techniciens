'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Icônes
import { Search, Loader2, Copy, Mail, Phone, User, Wrench, AlertCircle, LogOut } from 'lucide-react';

// Définition du type de données (mise à jour pour inclure tous les champs)
interface Technicien {
  nom_technicien: string;
  email_technicien: string;
  telephone_technicien: string;
  region: string;
  resp_exploitation_email: string;
  resp_exploitation_tel: string;
  resp_tech_email: string;
  resp_tech_tel: string;
}

// Composant pour copier une valeur spécifique
const CopyButton: React.FC<{ value: string | undefined, label: string, icon: React.ReactNode }> = ({ value, label, icon }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    // Ne rien faire si la valeur est 'N/A' ou vide
    if (!text || text.trim().toUpperCase() === 'NA' || text.trim() === '') return;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Réinitialise l'état "Copié"
    }).catch(err => {
      console.error('Erreur de copie:', err);
      // Fallback pour les navigateurs non sécurisés
      alert(`Impossible de copier. Veuillez copier manuellement : ${text}`);
    });
  };

  // Gérer 'Na' (commun dans les exports Excel) ou undefined/null
  const displayValue = (!value || value.trim().toUpperCase() === 'NA') ? 'N/A' : value.trim();
  const isAvailable = displayValue !== 'N/A';

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
      <span className="flex items-center text-gray-600">
        {icon}
        <span className="ml-2 text-sm">{label}</span> :
      </span>
      
      <div className="flex items-center space-x-2">
        <span className={`font-medium text-sm ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>{displayValue}</span>
        {isAvailable && (
          <button
            onClick={() => copyToClipboard(displayValue!)}
            className={`p-1 rounded-full transition duration-150 ${
              copied 
                ? 'bg-green-100 text-green-600' // Style "Copié"
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-blue-600' // Style normal
            }`}
            title={`Copier ${label}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
        {copied && (
          <span className="text-xs text-green-600">Copié !</span>
        )}
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [codeSecteur, setCodeSecteur] = useState('');
  const [results, setResults] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pour la déconnexion
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeSecteur) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`/api/search?code=${codeSecteur.toUpperCase().trim()}`);
      
      if (!response.ok) {
        // Tenter d'extraire l'erreur détaillée du corps de la réponse JSON
        const errorData = await response.json();
        // Gérer l'erreur 401 (Non autorisé)
        if (response.status === 401) {
            setError("Session expirée. Reconnexion nécessaire.");
            // Forcer la déconnexion
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh();
            return;
        }
        throw new Error(errorData.error || "Erreur lors de la requête API.");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResults(data);

    } catch (err: any) {
      console.error("Erreur de recherche:", err);
      // Afficher l'erreur détaillée capturée
      setError(err.message || "La recherche a échoué. Veuillez vérifier le code et votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Helper pour render une section de contact
  const renderContactSection = (title: string, icon: React.ReactNode, contacts: { label: string, value: string | undefined, icon: React.ReactNode }[]) => (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-100 mb-6">
      <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-3 border-b pb-2">
        {icon}
        <span className="ml-2">{title}</span>
      </h3>
      <div className="space-y-1">
        {contacts.map((contact, i) => (
          <CopyButton key={i} value={contact.value} label={contact.label} icon={contact.icon} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-4xl text-center py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Annuaire des Contacts Techniques
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Recherchez par code technicien pour obtenir toutes les coordonnées.
        </p>
      </header>

      {/* Carte principale pour la recherche et les résultats */}
      <div className="w-full max-w-xl bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200">
        
        {/* Formulaire de Recherche */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Entrez le code Technicien (ex: R11A, 2237)"
            value={codeSecteur}
            onChange={(e) => setCodeSecteur(e.target.value)}
            disabled={loading}
            // Style de la clé de recherche en noir
            className="flex-grow p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-900 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-400"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <Search className="h-5 w-5 mr-2" />
            )}
            Rechercher
          </button>
        </form>

        {/* Affichage des Résultats */}
        <div className="mt-8">
          {error && (
            <div className="mt-4 p-4 flex items-start bg-red-100 text-red-700 border border-red-300 rounded-lg">
              <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
              <p className="font-medium text-sm">
                Erreur: {error}
              </p>
            </div>
          )}
          {results.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
                Résultats pour "{codeSecteur}" ({results.length})
              </h2>
              {results.map((tech, index) => (
                // Carte de résultat
                <div key={index} className="bg-gray-50 p-5 rounded-xl shadow-2xl border border-blue-100">
                  
                  {/* Région et Titre */}
                  <div className="mb-4 pb-2 border-b border-blue-200">
                    <p className="text-2xl font-extrabold text-gray-900">{tech.nom_technicien || 'N/A'}</p>
                    <p className="text-sm font-medium text-blue-600 mt-1">Région : {tech.region || 'N/A'}</p>
                  </div>

                  {/* === ORDRE MODIFIÉ === */}

                  {/* Section Technicien (1) */}
                  {renderContactSection("Coordonnées Technicien", <User className="h-5 w-5" />, [
                    { label: "Email", value: tech.email_technicien, icon: <Mail className="h-4 w-4 text-orange-500" /> },
                    { label: "Téléphone", value: tech.telephone_technicien, icon: <Phone className="h-4 w-4 text-orange-500" /> },
                  ])}
                  
                  {/* Section Responsable Technique (2) */}
                  {renderContactSection("Responsable Technique", <Wrench className="h-5 w-5" />, [
                    { label: "Email", value: tech.resp_tech_email, icon: <Mail className="h-4 w-4 text-purple-500" /> },
                    { label: "Téléphone", value: tech.resp_tech_tel, icon: <Phone className="h-4 w-4 text-purple-500" /> },
                  ])}
                  
                  {/* Section Responsable Exploitation (3) */}
                  {renderContactSection("Responsable Exploitation", <User className="h-5 w-5" />, [
                    { label: "Email", value: tech.resp_exploitation_email, icon: <Mail className="h-4 w-4 text-green-500" /> },
                    { label: "Téléphone", value: tech.resp_exploitation_tel, icon: <Phone className="h-4 w-4 text-green-500" /> },
                  ])}

                </div>
              ))}
            </div>
          ) : !loading && codeSecteur && !error && (
            <p className="text-center text-gray-500 mt-8 p-4 bg-gray-100 rounded-lg">
              Aucun technicien trouvé pour le code "{codeSecteur}".
            </p>
          )}
        </div>
      </div>
      
      <footer className="w-full max-w-xl flex justify-between items-center mt-6 text-sm text-gray-500">
        <a href="/admin" className="text-blue-500 hover:underline">Accès administrateur</a>
        <button
          onClick={handleSignOut}
          className="flex items-center text-red-500 hover:text-red-700 hover:underline"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Déconnexion
        </button>
      </footer>
    </div>
  );
};

export default SearchPage;