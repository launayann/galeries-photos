#!/bin/bash

# Configuration
SOURCE_DIR="/home/yann/Documents/galeries-photos/photos"
OUTPUT_DIR="/home/yann/Documents/galeries-photos/optimized"
SITE_DIR="/home/yann/Documents/galeries-photos"
REPO_URL="https://github.com/launayann/galeries-photos"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🖼️  Optimisation et déploiement de la galerie photo${NC}"
echo "=================================================="

# Vérifier si ImageMagick est installé
if ! command -v magick &> /dev/null; then
    echo -e "${RED}❌ ImageMagick n'est pas installé${NC}"
    echo "Installation : sudo dnf install ImageMagick"
    exit 1
fi

# Créer les répertoires si nécessaire
mkdir -p "$OUTPUT_DIR"/{thumbnails,medium,original}
mkdir -p "$SITE_DIR/css"
mkdir -p "$SITE_DIR/js"

# Fonction d'optimisation des images
optimize_images() {
    echo -e "${YELLOW}📸 Optimisation des images...${NC}"

    # Compter le nombre d'images
    total_images=$(find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | wc -l)
    current=0

    # Traiter chaque image
    find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r img; do
        current=$((current + 1))
        filename=$(basename "$img")
        name_without_ext="${filename%.*}"

        echo "[$current/$total_images] Traitement de $filename"

        # Thumbnail 300x300 (carré, recadré)
        magick "$img" -resize 300x300^ -gravity center -extent 300x300 -quality 85 "$OUTPUT_DIR/thumbnails/${name_without_ext}.jpg"

        # Version moyenne 800px de large max
        magick "$img" -resize 800x800\> -quality 90 "$OUTPUT_DIR/medium/${name_without_ext}.jpg"

        # Version originale optimisée (max 1920px)
        magick "$img" -resize 1920x1920\> -quality 95 "$OUTPUT_DIR/original/${name_without_ext}.jpg"
    done
}

# Générer les métadonnées JSON
generate_metadata() {
    echo -e "${YELLOW}📋 Génération des métadonnées...${NC}"

    cat > "$SITE_DIR/photos.json" << 'EOF'
{
  "photos": [
EOF

    first=true
    find "$OUTPUT_DIR/thumbnails" -name "*.jpg" | sort | while read -r thumb; do
        filename=$(basename "$thumb" .jpg)

        # Obtenir les dimensions de l'image moyenne
        dimensions=$(magick identify -format "%wx%h" "$OUTPUT_DIR/medium/${filename}.jpg" 2>/dev/null || echo "800x600")
        width=$(echo "$dimensions" | cut -d'x' -f1)
        height=$(echo "$dimensions" | cut -d'x' -f2)

        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$SITE_DIR/photos.json"
        fi

        cat >> "$SITE_DIR/photos.json" << EOF
    {
      "id": "${filename}",
      "thumbnail": "optimized/thumbnails/${filename}.jpg",
      "medium": "optimized/medium/${filename}.jpg",
      "original": "optimized/original/${filename}.jpg",
      "width": ${width},
      "height": ${height},
      "title": "${filename}"
    }
EOF
    done

    cat >> "$SITE_DIR/photos.json" << 'EOF'
  ]
}
EOF
}

# Déployer sur GitHub Pages
deploy_to_github() {
    echo -e "${YELLOW}🚀 Déploiement sur GitHub Pages...${NC}"

    cd "$SITE_DIR" || exit 1

    # Initialiser git si nécessaire
    if [ ! -d ".git" ]; then
        git init
        git remote add origin "$REPO_URL"
    fi

    # Ajouter tous les fichiers
    git add .
    git commit -m "Mise à jour de la galerie - $(date '+%Y-%m-%d %H:%M:%S')"

    # Pousser vers GitHub
    git push -u origin main

    echo -e "${GREEN}✅ Déploiement terminé !${NC}"
    echo -e "Votre galerie sera disponible à : https://launayann.github.io/galeries-photos"
}

# Menu principal
case "$1" in
    "optimize")
        optimize_images
        generate_metadata
        ;;
    "deploy")
        deploy_to_github
        ;;
    "all"|"")
        optimize_images
        generate_metadata
        deploy_to_github
        ;;
    *)
        echo "Usage: $0 [optimize|deploy|all]"
        echo "  optimize: Optimise seulement les images"
        echo "  deploy:   Déploie seulement sur GitHub"
        echo "  all:      Optimise et déploie (défaut)"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Terminé !${NC}"
