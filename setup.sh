#!/bin/bash

# Script d'installation pour la galerie photos
# Fedora 42 KDE

echo "🚀 Installation de la galerie photos"
echo "===================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Répertoires
WORK_DIR="/home/yann/Documents/galeries-photos"
REPO_URL="https://github.com/launayann/galeries-photos"

# Fonction de vérification des prérequis
check_requirements() {
    echo -e "${YELLOW}🔍 Vérification des prérequis...${NC}"

    # Vérifier Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git n'est pas installé${NC}"
        echo "Installation : sudo dnf install git"
        exit 1
    fi

    # Vérifier ImageMagick
    if ! command -v magick &> /dev/null; then
        echo -e "${YELLOW}⚠️  ImageMagick n'est pas installé${NC}"
        echo "Installation..."
        sudo dnf install -y ImageMagick

        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Échec de l'installation d'ImageMagick${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}✅ Tous les prérequis sont satisfaits${NC}"
}

# Créer la structure du projet
setup_project() {
    echo -e "${YELLOW}📁 Configuration du projet...${NC}"

    # Créer le répertoire principal
    mkdir -p "$WORK_DIR"
    cd "$WORK_DIR" || exit 1

    # Créer la structure des dossiers
    mkdir -p {photos,optimized/{thumbnails,medium,original},css,js,.github/workflows}

    # Copier les fichiers depuis les artifacts
    echo "Veuillez copier les fichiers suivants dans leur répertoire respectif :"
    echo "  - index.html (racine)"
    echo "  - css/style.css"
    echo "  - js/gallery.js"
    echo "  - sw.js (racine)"
    echo "  - .github/workflows/deploy.yml"

    echo -e "${GREEN}✅ Structure du projet créée${NC}"
}

# Initialiser le dépôt Git
setup_git() {
    echo -e "${YELLOW}🔧 Configuration Git...${NC}"

    cd "$WORK_DIR" || exit 1

    # Initialiser le dépôt si nécessaire
    if [ ! -d ".git" ]; then
        git init
        git branch -m main
    fi

    # Configurer le remote
    if ! git remote | grep -q origin; then
        git remote add origin "$REPO_URL"
    fi

    # Créer .gitignore
    cat > .gitignore << 'EOF'
# Fichiers temporaires
*.tmp
*.temp
.DS_Store
Thumbs.db

# Logs
*.log

# Environnements de développement
.vscode/
.idea/

# Fichiers de sauvegarde
*~
*.bak
EOF

    echo -e "${GREEN}✅ Git configuré${NC}"
}

# Créer un exemple de configuration
create_example() {
    echo -e "${YELLOW}📸 Création d'exemples...${NC}"

    cd "$WORK_DIR" || exit 1

    # Créer un fichier README
    cat > README.md << 'EOF'
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
EOF

    # Créer un exemple photos.json vide
    cat > photos.json << 'EOF'
{
  "photos": []
}
EOF

    echo -e "${GREEN}✅ Exemples créés${NC}"
}

# Rendre le script executable
make_executable() {
    echo -e "${YELLOW}🔧 Configuration des permissions...${NC}"

    # Copier le script de galerie (vous devrez le faire manuellement)
    if [ -f "gallery.sh" ]; then
        chmod +x gallery.sh
        echo -e "${GREEN}✅ Script gallery.sh rendu exécutable${NC}"
    else
        echo -e "${YELLOW}⚠️  Copiez le script gallery.sh et rendez-le exécutable avec : chmod +x gallery.sh${NC}"
    fi
}

# Instructions finales
show_instructions() {
    echo -e "${GREEN}🎉 Installation terminée !${NC}"
    echo ""
    echo "Prochaines étapes :"
    echo "1. Copiez tous les fichiers des artifacts dans les bons répertoires"
    echo "2. Ajoutez vos photos dans le dossier 'photos/'"
    echo "3. Exécutez './gallery.sh' pour optimiser et déployer"
    echo "4. Configurez GitHub Pages dans les paramètres de votre dépôt"
    echo ""
    echo "Répertoire de travail : $WORK_DIR"
    echo "Dépôt GitHub : $REPO_URL"
    echo ""
    echo -e "${YELLOW}💡 Conseil :${NC} Utilisez des noms de fichiers sans espaces ni caractères spéciaux"
}

# Exécution du script
main() {
    check_requirements
    setup_project
    setup_git
    create_example
    make_executable
    show_instructions
}

# Lancer le script principal
main "$@"
