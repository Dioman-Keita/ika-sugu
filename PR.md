# Pull Request: Admin Product Authoring Hardening

Cette PR renforce le back-office produit pour l'aligner avec le contrat metier reel du catalogue. Elle corrige le flux d'upload d'images, enrichit fortement le formulaire admin, ajoute les statuts produit, structure mieux la creation de variantes, et branche la publication reelle cote storefront.

## Objectif

- Corriger le bug d'ajout produit lie a l'upload d'images.
- Faire converger l'interface admin avec le modele produit/variantes reellement utilise.
- Prepararer un vrai back-office bilingue `fr/en`.
- Introduire un cycle de vie produit `DRAFT / PUBLISHED / ARCHIVED`.
- Stabiliser le cycle de vie des medias uploades avant sauvegarde.

## Architecture metier

Le modele retenu est un modele e-commerce classique `Product + Variants`, tres proche d'une logique `SPU / SKU`.

- `Product`
  - fiche produit parent
  - unite catalogue / marketing
  - porte le contenu commun: nom, slug, description, categorie, dress style, statut, langue source, traductions, specs
- `ProductVariant`
  - unite vendable
  - porte le contenu variable: couleur, taille, prix, compare-at price, stock, images, SKU, isActive

En pratique:

- la page produit storefront correspond a la fiche produit
- l'utilisateur choisit ensuite une variante
- le `SKU` est genere uniquement par le backend

Ce n'est pas un modele "variant-first hierarchique". Les variantes sont plates et rattachees a un produit parent.

## Fonctionnement du formulaire admin

Le flux d'ajout suit maintenant cette logique:

1. Choisir la langue source
2. Renseigner les contenus traduits `fr/en`
3. Generer ou ajuster le slug
4. Completer les metadonnees produit
5. Ajouter les variantes vendables

Regles de lecture du formulaire:

- ce qui est commun a toutes les declinaisons va sur la fiche produit
- ce qui change selon une option achetable va sur la variante

Exemples:

- fiche produit:
  - nom
  - description
  - categorie
  - statut
  - specs traduites
- variante:
  - couleur
  - taille
  - stock
  - prix
  - images
  - SKU

## Changements principaux

### 1. Upload image admin sécurisé et stabilisé

- **Upload côté serveur (Server Action) :** Transition d'un upload direct client vers une action serveur (`uploadAdminProductImageAction`). Cela résout le conflit d'authentification entre Better Auth et les politiques RLS de Supabase.
- **Utilisation du Service Role :** L'action serveur utilise la `SUPABASE_SERVICE_ROLE_KEY` pour uploader les fichiers de manière sécurisée après avoir vérifié les droits admin via Better Auth.
- **Optimisation Next.js Image :** Configuration du bucket en mode "Public" et mise à jour des `remotePatterns` dans `next.config.mjs` pour permettre l'optimisation des images par Next.js sans erreur 403.
- **Validation et compression :** Maintien de la validation des types/tailles et de la compression (`browser-image-compression`) côté client avant l'envoi au serveur pour économiser de la bande passante.
- **Gestion du cycle de vie :**
  - Suppression immédiate des fichiers retirés depuis l'UI admin.
  - Cleanup au `cancel` lors de la création produit.
  - Cleanup après `save` des uploads restés orphelins.
  - Fallback de cleanup sur fermeture brutale d'onglet via `sendBeacon` / `keepalive`.

Fichiers clés :

- `src/app/actions/admin.ts` (Action d'upload sécurisée)
- `src/lib/storage/uploadImage.ts` (Refactorisé pour utiliser l'action serveur)
- `src/components/admin/ProductImageUploader.tsx` (Simplification de la logique client)
- `src/lib/supabase/server.ts` (Client avec Service Role)
- `next.config.mjs` (Autorisation du hostname Supabase)

### 2. Contrat admin produit elargi

- `SKU` genere uniquement par le backend
- `dressStyle`, `size`, `currency`, `status`, `sourceLocale` structures en listes deroulantes
- support des traductions obligatoires `fr` et `en`
- support des specs traduites:
  - `material`
  - `care`
  - `fit`
  - `pattern`
- support du flag `isActive` sur les variantes
- slug auto-genere depuis la langue source, mais editable
- bouton de regeneration du slug
- affichage du `SKU` de la variante selectionnee cote storefront

Fichiers cles:

- `src/components/admin/ProductForm.tsx`
- `src/app/actions/admin.ts`
- `src/components/product-page/Header/index.tsx`
- `src/lib/catalog-options.ts`
- `src/lib/i18n/messages.ts`

### 3. Evolution Prisma et publication produit

- ajout de `Product.status`
- ajout de `Product.sourceLocale`
- nouvelle enum `ProductStatus`
- migration Prisma ajoutee au repo
- le storefront ne remonte plus que les produits `PUBLISHED`

Fichiers cles:

- `prisma/schema.prisma`
- `prisma/migrations/20260330090000_add_product_status_and_source_locale/migration.sql`
- `src/app/actions/catalog.ts`

### 4. Liste admin produits amelioree

- affichage du statut produit dans la liste admin
- filtres `All / Draft / Published / Archived`
- pagination compatible avec le filtre de statut

Fichiers cles:

- `src/app/admin/products/page.tsx`
- `src/hooks/use-admin.ts`
- `src/components/admin/StatusBadge.tsx`
- `src/app/actions/admin.ts`

### 5. Couleurs et variantes

- le select couleur admin est maintenant compact
- il accepte une palette predefinie plus une saisie libre CSS (`hex`, `rgb()`, `hsl()`, etc.)
- la palette a ete alignee avec les couleurs visibles cote storefront, tout en gardant `Gray` et `Brown` presents dans les seeds

Fichier cle:

- `src/components/admin/ProductForm.tsx`

### 6. Documentation projet

- ajout d'un cadrage dedie pour la feature admin produit
- ajout d'un document d'alerte sur les points critiques du repo

Fichiers:

- `admin-product-authoring.md`
- `emmergency.md`

## Migration

Commande appliquee/requise pour cette PR:

```powershell
bunx prisma migrate deploy
```

Puis, si necessaire:

```powershell
bun run generate-prisma-client
```

## Test manuel recommande

Checklist manuelle utile:

- creer un produit en `DRAFT`
- verifier que le slug se genere depuis la langue source
- modifier manuellement le slug
- utiliser "Regenerer" pour le recalculer
- renseigner `fr/en` et sauvegarder
- ajouter plusieurs variantes
- verifier la generation backend des SKU
- uploader des images, en supprimer une, puis sauvegarder
- uploader une image puis annuler la creation
- uploader une image puis fermer brutalement l'onglet
- republier le produit en `PUBLISHED`
- verifier qu'il apparait bien sur le storefront
- ouvrir la page produit et verifier l'affichage du SKU de la variante selectionnee
- verifier les filtres de statut dans la liste admin

## Verification

- [x] `bun run typecheck`
- [x] generation backend des `SKU`
- [x] upload admin avec suppression serveur des images retirees
- [x] cleanup best-effort en cas de fermeture brutale de l'onglet
- [x] formulaire produit bilingue `fr/en`
- [x] statuts produit branches en admin et storefront
- [x] affichage storefront du `SKU` de la variante selectionnee

## Risques / limites restantes

- le cleanup sur fermeture brutale reste best-effort par nature navigateur
- pas encore de strategie de purge differee pour d'eventuels assets tres anciens deja orphelins
- le back-office produit est maintenant beaucoup plus complet, mais il reste encore possible d'aller plus loin sur les facettes metier avancees et le workflow editorial
