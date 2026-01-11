# INOS - Skin Intelligence

Application de skincare intelligente focalisee sur l'analyse et le suivi des cernes et de la peau du visage.

## Fonctionnalites

### Ecrans d'Introduction
- 4 slides animees expliquant le fonctionnement de l'app
- Presentation du scan intelligent
- Explication du suivi des progres
- Decouverte des routines personnalisees
- Navigation fluide avec pagination animee

### Onboarding & Quiz
- Quiz personnalise sur les habitudes de sommeil, le type de cernes, le mode de vie
- Identification du type de peau
- Definition des objectifs utilisateur
- Authentification par email avec verification OTP

### Dashboard
- Score actuel avec evolution
- Apercu du scan premium (pour utilisateurs non-premium)
- Grille de 6 metriques en preview avec CTA d'upgrade
- Historique recent des analyses
- Conseils personnalises

### Scan Facial
- Camera frontale avec guide ovale pour le visage
- Detection de la zone des yeux
- Capture de selfie pour analyse
- Mode basique (cernes) et mode premium (visage complet)

### Analyse IA des Cernes (Gratuit)
- Identification du type de cernes (vasculaires, pigmentaires, structurels, mixtes)
- Score d'intensite (0-100)
- Analyse separee oeil gauche/droit
- Recommandations personnalisees
- Analyse alimentee par Google Gemini AI

### Analyse Complete du Visage (Premium)
- 9 metriques detaillees: Acne, Hydratation, Rides, Pigmentation, Pores, Rougeurs, Eclat, Uniformite, Zone Yeux
- Analyse par zone faciale: Front, Joues, Nez, Menton, Contour des yeux
- Radar chart interactif pour vue d'ensemble
- Age percu et age des yeux
- Score ITA et type de teint
- Zones prioritaires et recommandations personnalisees
- Detail par metrique avec visualisation des zones
- Page de resultats premium avec 3 onglets: Apercu, Details, Conseils
- Barres de progression animees pour chaque metrique
- Sauvegarde automatique dans Supabase (table full_face_analyses)

### Suivi & Historique
- Comparaison avant/apres avec photos
- Evolution du score dans le temps
- Historique complet des analyses

### Boutique & Produits
- Catalogue de produits skincare premium
- Panier d'achat avec gestion des quantites
- Categories: serums, cremes, masques, outils, kits
- Produits recommandes selon l'analyse
- Checkout avec simulation de paiement

### Profil & Abonnement
- Gestion du profil utilisateur
- Plans d'abonnement (mensuel/annuel)
- Acces aux routines personnalisees
- Acces a l'analyse premium du visage

### Partage
- Partage du diagnostic avec des amis
- Invitation a telecharger l'app
- Comparaison de resultats

## Backend Supabase

L'application utilise Supabase comme backend pour:

### Authentification
- Inscription/Connexion par email/mot de passe
- Connexion par OTP (magic link)
- Session persistante

### Base de donnees
- Profils utilisateurs
- Historique des analyses (cernes + visage complet)
- Commandes et paiements
- Abonnements

### Stockage
- Photos d'analyses
- Avatars utilisateurs

### Securite (Row Level Security)
- Chaque utilisateur ne peut voir/modifier que ses propres donnees
- Politiques RLS sur toutes les tables

## Configuration Supabase

1. Creer un projet Supabase sur https://supabase.com
2. Ajouter les variables d'environnement dans l'onglet ENV:
   - `EXPO_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Cle anonyme de votre projet

3. Executer le schema SQL dans l'editeur SQL de Supabase (disponible dans `src/lib/supabase.ts` sous `SQL_SCHEMA`)

4. Configurer le bucket de stockage "photos" avec acces public

## Structure

```
src/
  app/
    index.tsx             # Splash screen
    intro.tsx             # Ecrans d'introduction (4 slides)
    onboarding.tsx        # Quiz d'onboarding + auth email/OTP
    scan.tsx              # Camera pour scan facial (basique + premium)
    results.tsx           # Resultats d'analyse cernes
    full-face-results.tsx # Resultats analyse complete (Premium)
    metric-detail.tsx     # Detail d'une metrique par zone
    subscription.tsx      # Plans d'abonnement
    share-diagnosis.tsx   # Partage du diagnostic
    cart.tsx              # Panier d'achat
    (tabs)/
      index.tsx           # Dashboard principal
      shop.tsx            # Boutique produits
      progress.tsx        # Suivi et historique
      profile.tsx         # Profil utilisateur
  components/
    RadarChart.tsx        # Graphique radar pour metriques
  lib/
    supabase.ts           # Client Supabase + services (auth, storage, DB)
    useAuth.ts            # Hook d'authentification
    AuthProvider.tsx      # Provider d'authentification
    store.ts              # Zustand store (etat local)
    email.ts              # Service d'envoi OTP via Resend
    gemini.ts             # Analyse IA via Google Gemini
    stripe.ts             # Catalogue produits
    cn.ts                 # Utilitaire classnames
```

## Tables Supabase

| Table | Description |
|-------|-------------|
| users | Profils utilisateurs (extends auth.users) |
| skin_analyses | Analyses basiques (cernes) |
| full_face_analyses | Analyses premium (visage complet) |
| orders | Commandes produits |
| payments | Historique des paiements |

## Metriques Premium

| Metrique | Description |
|----------|-------------|
| Acne | Presence d'imperfections, boutons, points noirs |
| Hydratation | Niveau d'hydratation de la peau |
| Rides | Presence de rides et ridules |
| Pigmentation | Uniformite du teint, presence de taches |
| Pores | Taille et visibilite des pores |
| Rougeurs | Presence de rougeurs et inflammations |
| Eclat | Luminosite et rayonnement de la peau |
| Uniformite | Texture generale de la peau |
| Zone Yeux | Etat du contour des yeux (cernes, poches, rides) |

## Design

- Theme sombre elegant avec gradient violet/bleu (#8B5CF6 -> #3B82F6)
- Background: #0A0A0F avec cards en #1A1625
- Bordures subtiles en #2D2555
- Animations fluides avec react-native-reanimated
- Interface intuitive et rassurante
- Style iOS/premium
- Radar chart pour visualisation des metriques
- Carte des zones faciales
