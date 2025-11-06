import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// Métadonnées de la page (apparaît dans l'onglet du navigateur)
export const metadata = {
  title: 'Annuaire Techniciens',
  description: 'Moteur de recherche par code secteur.',
}

// Le composant RootLayout DOIT retourner les balises <html> et <body>
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      {/* La classe de la police est appliquée au <body> pour tout le contenu */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}