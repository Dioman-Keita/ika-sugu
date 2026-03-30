# Pull Request: Admin Product Authoring Hardening

Cette PR transforme le back-office produit pour l’aligner avec le vrai contrat métier déjà attendu par le backend. Elle corrige le flux d’upload d’images, enrichit fortement le formulaire admin, ajoute les statuts produit et branche la publication réelle côté storefront.

## Objectif

- Corriger le bug d’ajout produit lié à l’upload d’images.
- Faire converger l’interface admin avec le modèle produit/variantes réellement utilisé.
- Préparer un vrai back-office bilingue `fr/en`.
- Introduire un cycle de vie produit `DRAFT / PUBLISHED / ARCHIVED`.

## Changements principaux

### 1. Upload image admin stabilisé

- Correction du preview d’images distantes via `next.config.mjs`.
- Meilleure gestion des erreurs Supabase dans `uploadImage.ts`.
- Suppression immédiate des fichiers retirés depuis l’UI admin.
- Cleanup au `cancel` lors de la création produit.
- Cleanup après `save` des uploads restés orphelins.
- Nouveau fallback de cleanup sur fermeture brutale d’onglet via `sendBeacon` / `keepalive`.

Fichiers clés :
- `src/components/admin/ProductImageUploader.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/app/api/admin/product-assets/cleanup/route.ts`
- `src/lib/storage/deleteImages.ts`
- `src/app/actions/admin.ts`

### 2. Contrat admin produit élargi

- `SKU` généré uniquement par le backend.
- `dressStyle`, `size`, `currency`, `status`, `sourceLocale` structurés en listes déroulantes.
- Support des traductions obligatoires `fr` et `en`.
- Support des specs traduites :
  - `material`
  - `care`
  - `fit`
  - `pattern`
- Support du flag `isActive` sur les variantes.

Fichiers clés :
- `src/components/admin/ProductForm.tsx`
- `src/app/actions/admin.ts`
- `src/lib/catalog-options.ts`
- `src/lib/i18n/messages.ts`

### 3. Évolution Prisma et publication produit

- Ajout de `Product.status`.
- Ajout de `Product.sourceLocale`.
- Nouvelle enum `ProductStatus`.
- Migration Prisma ajoutée au repo.
- Le storefront ne remonte plus que les produits `PUBLISHED`.

Fichiers clés :
- `prisma/schema.prisma`
- `prisma/migrations/20260330090000_add_product_status_and_source_locale/migration.sql`
- `src/app/actions/catalog.ts`

### 4. Liste admin produits améliorée

- Affichage du statut produit dans la liste admin.
- Filtres `All / Draft / Published / Archived`.
- Pagination compatible avec le filtre de statut.

Fichiers clés :
- `src/app/admin/products/page.tsx`
- `src/hooks/use-admin.ts`
- `src/components/admin/StatusBadge.tsx`
- `src/app/actions/admin.ts`

### 5. Documentation projet

- Ajout d’un cadrage dédié pour la feature admin produit.
- Ajout d’un document d’alerte sur les points critiques du repo.

Fichiers :
- `admin-product-authoring.md`
- `emmergency.md`

## Migration

Commande appliquée/requise pour cette PR :

```powershell
bunx prisma migrate deploy
```

Puis, si nécessaire :

```powershell
bun run generate-prisma-client
```

## Vérification

- [x] `bun run typecheck`
- [x] Génération backend des `SKU`
- [x] Upload admin avec suppression serveur des images retirées
- [x] Cleanup best-effort en cas de fermeture brutale de l’onglet
- [x] Formulaire produit bilingue `fr/en`
- [x] Statuts produit branchés en admin et storefront

## Risques / limites restantes

- Le cleanup sur fermeture brutale reste best-effort par nature navigateur.
- Pas encore de stratégie de purge différée pour d’éventuels assets très anciens déjà orphelins.
- Le back-office produit est maintenant beaucoup plus complet, mais il reste encore possible d’aller plus loin sur les facettes métier avancées et le workflow éditorial.
