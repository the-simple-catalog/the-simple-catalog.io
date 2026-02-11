# Site E-Commerce for API Integration Purpose

Il s'agit d'un site web e-commerce statique qui permet de démontrer l'intégration de :
- Tracker Mirakl T2S de pages view des pages du site
- Afficher des produits recommandés via l'API Mirakl Ads sur les pages du e-commerce

Le site web statique de démo permet de naviguer dans un site web e-commerce classique avec les pages suivantes :
- Homepage
- Search
- Page catégories
- Page produit
- Simple checkout

---

## Site Web

Il s'agit d'un site statique de démo qui simule un site e-commerce.

### Types de Pages

- **Homepage** : affiche un menu avec les catégories racines
  - Page ID : `1000`
  - Tracking : oui
  - Ads sponso : non

- **Search** : permet de rechercher simplement un produit par son nom
  - Page ID : `2000`
  - Tracking : oui
  - Ads sponso : oui

- **Page Catégories** : affiche les produits de la catégorie et/ou les sous-catégories
  - Page ID : `1400`
  - Tracking : oui
  - Ads sponso : oui

- **Page Produit** : affiche les informations du produit (nom, image, prix) et permet d'ajouter au panier
  - Page ID : `1200`
  - Tracking : oui
  - Ads sponso : oui

- **Page Cart (Panier)** : affiche un résumé du contenu du panier avec les produits ajoutés et un lien vers la page de checkout pour payer la commande
  - Page ID : `1600`
  - Tracking : oui
  - Ads sponso : non

- **Page Checkout** : remplir adresse de livraison et payer la commande. Une adresse et carte de test déjà préremplies. Payment toujours ok.
  - Tracking : non
  - Ads sponso : non

- **Page de Postpayment** : page de confirmation
  - Page ID : `2400`
  - Tracking : oui
  - Ads sponso : non

**Note** : Chaque type de page a un ID qui sera fourni au tracker et à l'API de sponso.

---

## Catalogue

Le catalogue consiste en :
- Une arborescence de catégories
- Des produits (1P ou 3P) rattachés à une catégorie

**Stockage** :
- Le catalogue (catégories + produits) sera stocké en local storage (volumétrie max : 1000 produits)
- Le catalogue sera importé via 2 fichiers JSON :
  - `categories.json`
  - `products.json`

---

## Admin

Une page d'administration/settings permettra à l'utilisateur de configurer son site web statique :
(la page n'a pas besoin d'être protégée donc puisque modifie les local settings)

**Fonctionnalités** :
- Importer son catalogue
- Définir des settings :
  - Nom du site : `"demo"` par défaut
  - T2S tracking URL : _not used for now_
  - Ads server URL : _not used for now_

---

## Format de Produits

### Champs du Produit

**Identifiants** :
- `id` : c'est le fwid du produit qui sera utilisé dans les APIs tracker/reco
- `sku` : ID business utilisé par le seller en 3P ou advertiser en 1P

**À afficher** :
- `id`
- `name` : nom du produit
- `longDescription` : description détaillée
- `imageUrl` : image du produit
- `regularPrice` / `promoPrice` : prix régulier ou prix promo (si non null)
- `INSIGHT_BRAND` : marque du produit (si elle existe)

**Autres champs** :
- `stockQuantity` : stock (pas vraiment utile dans notre démo)
- `categories` : liste des IDs des catégories où le produit appartient
  - Pour faire simple, on peut prendre que la première

### Exemple JSON

```json
[
  {
    "action": "upsert",
    "type": "product",
    "id": "4123018513199-0",
    "content": {
      "sku": "4123018513199-1P",
      "name": "Naruto and the dragon Karimo - manga",
      "longDescription": "Dive into a thrilling adventure, ideal for comic book fans.",
      "url": "https://the-simple-catalog.github.io/the-simple-catalog.io/",
      "imageUrl": "https://the-simple-catalog.github.io/the-simple-catalog.io/assets/media/4123018513199.jpg",
      "partyTypes": "1P",
      "shortDescription": "Dive into a thrilling adventure, ideal for comic book fans.",
      "categories": ["1-1-1"],
      "regularPrice": "7.5",
      "promoPrice": null,
      "salable": true,
      "stockQuantity": 100,
      "buyboxWinnerShopId": null,
      "characteristics": [
        {
          "id": "INSIGHT_BRAND",
          "name": "INSIGHT_BRAND",
          "values": [
            {
              "id": "HarperCollins",
              "value": "HarperCollins"
            }
          ]
        }
      ],
      "attributes": {
        "ean": "4123018513199"
      },
      "isInStock": true
    }
  }
  // ...
]
```

---

## Format Catégories

### Champs de Catégorie

- `id` : ID de la catégorie
- `content.name` : Nom de la catégorie
- `content.parentId` : ID de la catégorie parent
  - Si `parentId = "root"` → catégorie racine (note : `"root"` n'existe pas réellement)

**Note** : Le fichier est construit en partant des catégories racine vers les catégories feuille.

### Exemple JSON

```json
[
  {
    "type": "category",
    "action": "upsert",
    "id": "1",
    "content": {
      "name": "Book",
      "parentId": "root",
      "status": "enabled"
    }
  },
  {
    "type": "category",
    "action": "upsert",
    "id": "1-1",
    "content": {
      "name": "Manga and comics",
      "parentId": "1",
      "status": "enabled"
    }
  }
  // ...
]
```

---

## Navigation

### Menu
- Avoir un menu avec les catégories rattachées à `"root"`

### Page Catégorie
- Affiche ses sous-catégories
- Affiche les produits qui ont la propriété `categories` contenant la catégorie courante
- Produits affichés sous forme de cards

### Search (Recherche)

La recherche doit être très basique avec une barre de recherche :
- Faire un `contains` dans le nom des produits
- Afficher les produits sous forme de cards
- Afficher un message si pas de résultat
- Rechercher à partir de 3 caractères minimum

---

## Tracking

Le tracking enverra des événements de vue sur chaque page.

**Rien à afficher** sur l'interface.

### Implémentation
- Sur chaque page :
  - Pour l'instant, utiliser `console.log` au lieu d'appeler l'API
  - Informations à logger :
    - ID de la page
    - Type de page : `homepage` / `category` / `search` / `product` / `postpayment` (checkout)

---

## Adserving Sponsoring

Cette API retournera des produits sponsorisés pour chaque page.

### Pages concernées
- Uniquement sur : **page catégories** / **search** / **product**
- Prévoir une zone **"best products"**

### Implémentation (pour l'instant)
- Utiliser `console.log` au lieu d'appeler l'API avec :
  - ID de la page
  - Type de page : `homepage` / `category` / `search` / `product` / `postpayment` (checkout)

### Zone "Sponsored Products"
- Prévoir une zone de **4 produits** sponsorisés
- Mettre **4 zones grises** (car aucun produit retourné pour l'instant)
- Ajouter un label **"Sponsored Products"**

### Règles d'affichage
- **Homepage / Checkout** : pas de produits sponsorisés
- **Page catégories / Search / Product** : afficher la zone "best products"

---

## E-Commerce Theme

### Style et Design
- **Style** : Moderne, professionnel (style Amazon)
- **Technologies** : HTML / JS / CSS
- **Animation** : Animations simples
- **Langue** : Texte en anglais
- **Code** : Simple, commenté et bien structuré pour faciliter l'édition par LLM

---

## Dev Guide

### Ressources disponibles
- Des exemples de catalogue sont fournis dans :
  - `products_1P_t2s.json`
  - `categories_t2s.json`
- Environ **600 produits** et **700 catégories** de démonstration

### Plan de développement
1. Vous pouvez commencer à construire le site web avec les données d'exemple
2. Le tracking et l'API adserving seront ajoutés plus tard
