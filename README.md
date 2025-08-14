# Galerie Photos

Une galerie photos responsive et performante déployée sur GitHub Pages.

## Structure du projet

```
galeries-photos/
├── photos/              # Vos photos originales (ajoutez vos images ici)
├── optimized/           # Photos optimisées (généré automatiquement)
├── css/
│   └── style.css
├── js/
│   └── gallery.js
├── index.html
├── photos.json          # Métadonnées (généré automatiquement)
└── sw.js               # Service Worker pour la mise en cache
```

## Utilisation

1. Ajoutez vos photos dans le dossier `photos/`
2. Exécutez `./gallery.sh` pour optimiser et déployer
3. Votre galerie sera disponible sur GitHub Pages

## Formats supportés

- JPEG (.jpg, .jpeg)
- PNG (.png)

Les images sont automatiquement optimisées en 3 formats :
- Thumbnails : 300x300px (carrés)
- Medium : 800px max
- Original : 1920px max

## Performance

- Lazy loading des images
- Service Worker pour la mise en cache
- Images responsive avec srcset
- Interface optimisée mobile-first
