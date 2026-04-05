# Currency Philosophy Spec

## But

Mettre en place un vrai système de devise cible globale pour le site.

Aujourd'hui, l'application est implicitement centrée sur une seule devise. Le but de cette branche est de rendre la conversion monétaire :

- cohérente
- configurable
- traçable
- sûre pour l'affichage et le paiement

## Décisions produit déjà actées

- La devise cible est globale au site.
- Elle sera configurable depuis une section `Settings` du dashboard admin.
- La devise cible impacte l'affichage des prix.
- La devise cible impacte aussi le paiement.
- `XOF` est le code canonique à utiliser pour `FCFA`.

## Modèle métier

### 1. Devise source

Chaque variante garde sa devise source réelle.

Exemples :

- une variante peut être créée en `USD`
- une autre en `EUR`
- une autre en `XOF`

Cette devise source est la vérité métier d'origine du prix saisi dans l'admin.

### 2. Devise cible

Le site possède une devise cible unique active.

Exemples :

- site réglé sur `USD`
- site réglé sur `EUR`
- site réglé sur `XOF`

Tous les prix affichés au storefront et utilisés au paiement doivent être convertis vers cette devise cible.

### 3. Taux de conversion

Les conversions ne doivent pas dépendre d'appels live à chaque affichage.

Le site doit utiliser :

- une source externe fiable pour récupérer les taux
- un stockage local des taux
- un service interne de conversion utilisé par le reste de l'app

### 4. Prix de commande

Au moment de la commande, la conversion doit être figée.

Une commande doit stocker :

- le montant source
- la devise source
- la devise cible utilisée pour payer
- le taux appliqué
- le montant converti final

Cela garantit la traçabilité même si les taux changent plus tard.

## Provider recommandé

Provider conseillé : `currencyapi`

Pourquoi :

- support de `XOF`
- support de `base_currency`
- endpoints simples pour `latest`
- bon fit pour un site e-commerce classique

Le provider ne doit jamais être appelé directement depuis le frontend.

## Politique de refresh

Fréquence retenue : toutes les `6 heures`

Pourquoi :

- plus sérieux qu'un refresh quotidien
- plus stable qu'un appel à chaque render
- suffisant pour un site e-commerce standard

Le refresh doit être fait côté serveur.

## Politique de fallback

Ordre de fallback :

1. utiliser le taux frais le plus récent
2. si indisponible, utiliser le dernier taux connu stocké en base
3. si aucun taux n'existe encore :
   - conserver l'affichage dans la devise source
   - empêcher d'activer une devise cible globale non exploitable

Cas particulier :

- pour le FCFA, on utilise toujours `XOF`

## Règles d'arrondi

Règles initiales recommandées :

- `USD` : 2 décimales
- `EUR` : 2 décimales
- `XOF` : 0 décimale

Mode d'arrondi :

- arrondi standard au plus proche

Non inclus au début :

- pas de prix marketing automatiques du type `x.99`
- pas d'arrondi commercial personnalisé

On garde d'abord un comportement simple, cohérent et auditable.

## Portée fonctionnelle

Le système doit couvrir :

- les cartes produit
- les pages produit
- le shop
- le panier
- le checkout
- les e-mails de commande plus tard si nécessaire
- l'admin là où des prix sont affichés

## Paramètres configurables

Une section `Settings` doit permettre de configurer au minimum :

- `targetCurrency`
- éventuellement plus tard `ratesProvider`
- éventuellement plus tard `lastRatesSyncAt` en lecture seule

La devise cible choisie doit être persistée côté serveur.

## Modèle de données proposé

### SiteSettings

Créer un modèle central de configuration site, avec au minimum :

- `id`
- `targetCurrency`
- `createdAt`
- `updatedAt`

Optionnel plus tard :

- `ratesProvider`
- `lastRatesSyncAt`

### ExchangeRate

Créer un modèle de taux de conversion avec :

- `id`
- `baseCurrency`
- `quoteCurrency`
- `rate`
- `provider`
- `fetchedAt`
- `createdAt`

Index recommandés :

- `(baseCurrency, quoteCurrency)`
- `fetchedAt`

### Order snapshot

La commande doit pouvoir figer :

- `sourceCurrency`
- `targetCurrency`
- `exchangeRate`
- `sourceAmount`
- `convertedAmount`

Si le modèle `Order` ne porte pas encore ça, il faudra l'étendre.

## Services à créer

### 1. Currency settings service

Responsable de :

- lire la devise cible active
- modifier la devise cible depuis l'admin

### 2. Exchange rates service

Responsable de :

- appeler le provider externe
- stocker ou mettre à jour les taux
- exposer le dernier taux exploitable

### 3. Money conversion service

Responsable de :

- convertir un montant d'une devise source vers une devise cible
- appliquer l'arrondi correct
- gérer les fallbacks

Signature attendue, idée :

```ts
convertMoney({
  amount,
  sourceCurrency,
  targetCurrency,
}): {
  amount: number;
  currency: string;
  rate: number | null;
  converted: boolean;
}
```

### 4. Money formatting service

Responsable de :

- formatter un prix selon la locale et la devise

Exemple :

```ts
formatMoney(amount, currency, locale);
```

## Règles UI/UX

### Storefront

- Le storefront affiche toujours la devise cible globale active.
- Si conversion impossible, afficher la devise source explicitement.
- Ne jamais afficher un montant converti sans savoir avec quel taux il a été calculé côté serveur.

### Admin

- L'admin continue de saisir le prix dans la devise source de la variante.
- La devise source reste visible dans le formulaire.
- La section `Settings` permet de changer la devise cible globale.
- Les labels et valeurs visibles doivent tous avoir leurs clés i18.

## Impacts techniques attendus

### Produits / variantes

Déjà présent :

- `currency` au niveau variante

À vérifier pendant l'implémentation :

- toutes les lectures de prix passent bien par une couche de conversion

### Catalog actions

Les server actions qui construisent le storefront devront :

- charger la devise cible active
- convertir les prix de variante
- propager la devise cible et le montant converti

### Cart / checkout

Le panier et la commande devront :

- utiliser la même devise cible globale
- éviter tout recalcul incohérent entre page produit, panier et checkout

## Checklist d'implémentation

### Phase 1

- ajouter `SiteSettings`
- ajouter `ExchangeRate`
- ajouter les helpers de conversion et de formatage
- ajouter la devise cible globale

### Phase 2

- créer la section `Admin > Settings`
- rendre la devise cible modifiable
- ajouter les clés i18 nécessaires

### Phase 3

- brancher le storefront sur la devise cible
- convertir les prix dans :
  - home
  - shop
  - page produit
  - panier
  - checkout

### Phase 4

- figer les données monétaires dans la commande
- sécuriser les fallbacks
- ajouter des tests ciblés

## Invariants à respecter

- pas de conversion monétaire côté client comme source de vérité
- pas d'appel provider à chaque render
- pas de paiement avec une devise cible non supportée par les taux disponibles
- pas d'écart entre prix produit, panier et checkout
- pas de texte visible sans i18 dans les nouveaux écrans admin

## Résumé

Cette branche sert à définir et implémenter une vraie politique monétaire pour le site :

- devise source par variante
- devise cible globale configurable
- conversion fiable via un provider externe
- stockage local des taux
- affichage cohérent
- paiement cohérent
- fallback propre

Le but n'est pas juste de "convertir des prix", mais d'introduire une infrastructure monétaire cohérente pour toute l'application.
