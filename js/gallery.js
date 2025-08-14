class PhotoGallery {
    constructor() {
        this.photos = [];
        this.filteredPhotos = [];
        this.currentIndex = 0;
        this.currentView = 'grid';
        
        this.initElements();
        this.bindEvents();
        this.loadPhotos();
    }

    initElements() {
        // Éléments principaux
        this.gallery = document.getElementById('gallery');
        this.searchInput = document.getElementById('search');
        this.searchClear = document.getElementById('search-clear');
        this.photoCounter = document.getElementById('photo-counter');
        this.photoTemplate = document.getElementById('photo-template');
        
        // Contrôles de vue
        this.viewButtons = document.querySelectorAll('.view-btn');
        
        // Lightbox
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImage = document.getElementById('lightbox-image');
        this.lightboxTitle = document.getElementById('lightbox-title');
        this.lightboxCounter = document.getElementById('lightbox-counter');
        this.lightboxClose = document.querySelector('.lightbox-close');
        this.lightboxPrev = document.querySelector('.lightbox-prev');
        this.lightboxNext = document.querySelector('.lightbox-next');
        this.lightboxOverlay = document.querySelector('.lightbox-overlay');
    }

    bindEvents() {
        // Recherche
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchClear.addEventListener('click', () => this.clearSearch());
        
        // Changement de vue
        this.viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.view-btn').dataset.view;
                this.changeView(view);
            });
        });
        
        // Lightbox
        this.lightboxClose.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrev.addEventListener('click', () => this.previousPhoto());
        this.lightboxNext.addEventListener('click', () => this.nextPhoto());
        this.lightboxOverlay.addEventListener('click', () => this.closeLightbox());
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Gestion du redimensionnement
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });
    }

    async loadPhotos() {
        try {
            const response = await fetch('photos.json');
            const data = await response.json();
            this.photos = data.photos || [];
            this.filteredPhotos = [...this.photos];
            this.renderGallery();
            this.updateCounter();
        } catch (error) {
            console.error('Erreur lors du chargement des photos:', error);
            this.showError('Impossible de charger les photos.');
        }
    }

    renderGallery() {
        // Nettoyer la galerie
        this.gallery.innerHTML = '';
        
        if (this.filteredPhotos.length === 0) {
            this.showEmptyState();
            return;
        }

        // Créer un fragment pour de meilleures performances
        const fragment = document.createDocumentFragment();
        
        this.filteredPhotos.forEach((photo, index) => {
            const photoElement = this.createPhotoElement(photo, index);
            fragment.appendChild(photoElement);
        });
        
        this.gallery.appendChild(fragment);
        
        // Appliquer la vue courante
        this.applyCurrentView();
        
        // Lazy loading des images
        this.initLazyLoading();
    }

    createPhotoElement(photo, index) {
        const template = this.photoTemplate.content.cloneNode(true);
        const photoItem = template.querySelector('.photo-item');
        const img = template.querySelector('.photo-image');
        const title = template.querySelector('.photo-title');
        const button = template.querySelector('.photo-button');
        
        // Configuration de l'élément
        photoItem.dataset.id = photo.id;
        photoItem.dataset.index = index;
        
        // Image avec lazy loading
        img.dataset.src = photo.thumbnail;
        img.alt = photo.title;
        img.loading = 'lazy';
        
        // Titre
        title.textContent = photo.title;
        
        // Événement de clic
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openLightbox(index);
        });
        
        photoItem.addEventListener('click', () => this.openLightbox(index));
        
        return photoItem;
    }

    initLazyLoading() {
        const images = this.gallery.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                        
                        // Effet de fade-in
                        img.addEventListener('load', () => {
                            img.style.opacity = '1';
                        });
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            images.forEach(img => {
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
                imageObserver.observe(img);
            });
        } else {
            // Fallback pour les navigateurs plus anciens
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredPhotos = [...this.photos];
            this.searchClear.style.display = 'none';
        } else {
            this.filteredPhotos = this.photos.filter(photo => 
                photo.title.toLowerCase().includes(searchTerm) ||
                photo.id.toLowerCase().includes(searchTerm)
            );
            this.searchClear.style.display = 'block';
        }
        
        this.renderGallery();
        this.updateCounter();
    }

    clearSearch() {
        this.searchInput.value = '';
        this.filteredPhotos = [...this.photos];
        this.searchClear.style.display = 'none';
        this.renderGallery();
        this.updateCounter();
    }

    changeView(view) {
        this.currentView = view;
        
        // Mettre à jour les boutons
        this.viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.applyCurrentView();
    }

    applyCurrentView() {
        this.gallery.className = `gallery ${this.currentView}-view`;
        
        if (this.currentView === 'masonry') {
            // Ajuster les colonnes selon la largeur d'écran
            this.adjustMasonryColumns();
        }
    }

    adjustMasonryColumns() {
        const width = window.innerWidth;
        let columns = 4;
        
        if (width < 480) columns = 1;
        else if (width < 768) columns = 2;
        else if (width < 1200) columns = 3;
        
        this.gallery.style.columnCount = columns;
    }

    openLightbox(index) {
        this.currentIndex = index;
        const photo = this.filteredPhotos[index];
        
        // Charger l'image haute résolution
        this.lightboxImage.src = photo.original;
        this.lightboxTitle.textContent = photo.title;
        this.updateLightboxCounter();
        
        // Afficher la lightbox
        this.lightbox.classList.add('active');
        this.lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Précharger les images adjacentes
        this.preloadAdjacentImages();
    }

    closeLightbox() {
        this.lightbox.classList.remove('active');
        this.lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    previousPhoto() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateLightboxPhoto();
        }
    }

    nextPhoto() {
        if (this.currentIndex < this.filteredPhotos.length - 1) {
            this.currentIndex++;
            this.updateLightboxPhoto();
        }
    }

    updateLightboxPhoto() {
        const photo = this.filteredPhotos[this.currentIndex];
        
        // Effet de transition
        this.lightboxImage.style.opacity = '0.5';
        
        setTimeout(() => {
            this.lightboxImage.src = photo.original;
            this.lightboxTitle.textContent = photo.title;
            this.updateLightboxCounter();
            this.lightboxImage.style.opacity = '1';
        }, 150);
        
        this.preloadAdjacentImages();
    }

    updateLightboxCounter() {
        const current = this.currentIndex + 1;
        const total = this.filteredPhotos.length;
        this.lightboxCounter.textContent = `${current} / ${total}`;
    }

    preloadAdjacentImages() {
        const preloadIndices = [this.currentIndex - 1, this.currentIndex + 1];
        
        preloadIndices.forEach(index => {
            if (index >= 0 && index < this.filteredPhotos.length) {
                const img = new Image();
                img.src = this.filteredPhotos[index].original;
            }
        });
    }

    handleKeydown(e) {
        if (!this.lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                this.closeLightbox();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousPhoto();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextPhoto();
                break;
        }
    }

    handleResize() {
        if (this.currentView === 'masonry') {
            this.adjustMasonryColumns();
        }
    }

    updateCounter() {
        const total = this.photos.length;
        const filtered = this.filteredPhotos.length;
        
        if (filtered === total) {
            this.photoCounter.textContent = `${total} photo${total > 1 ? 's' : ''}`;
        } else {
            this.photoCounter.textContent = `${filtered} / ${total} photo${total > 1 ? 's' : ''}`;
        }
    }

    showEmptyState() {
        this.gallery.innerHTML = `
            <div class="loading">
                <p>Aucune photo trouvée.</p>
                <button type="button" onclick="gallery.clearSearch()" style="
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                ">Effacer la recherche</button>
            </div>
        `;
    }

    showError(message) {
        this.gallery.innerHTML = `
            <div class="loading">
                <p style="color: #ef4444;">${message}</p>
                <button type="button" onclick="gallery.loadPhotos()" style="
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                ">Réessayer</button>
            </div>
        `;
    }
}

// Utilitaires de performance
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new PhotoGallery();
});

// Service Worker pour la mise en cache (optionnel)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}