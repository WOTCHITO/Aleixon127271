import { supabase, getMods, getModById } from './supabase.js';

class ApkModsApp {
    constructor() {
        this.currentPlatform = 'android';
        this.mods = [];
        this.filteredMods = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.handleURLParams();
        await this.loadMods();
        this.updateUI();
    }

    setupEventListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = item.dataset.platform;
                this.switchPlatform(platform);
                this.updateURL(platform);
            });
        });

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterMods(e.target.value);
            });
        }

        const modalOverlay = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        const id = urlParams.get('id');

        if (section && ['android', 'windows', 'iphone'].includes(section)) {
            this.currentPlatform = section;
            this.updateActiveNavItem();
        }

        if (id && id !== 'apkmods') {
            this.openModModal(parseInt(id));
        }
    }

    updateURL(platform) {
        const url = new URL(window.location);
        url.searchParams.set('section', platform);
        url.searchParams.set('id', 'apkmods');
        window.history.pushState({}, '', url);
    }

    switchPlatform(platform) {
        this.currentPlatform = platform;
        this.updateActiveNavItem();
        this.filterModsByPlatform();
        this.updateSectionTitle();
        this.renderMods();
    }

    updateActiveNavItem() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.platform === this.currentPlatform) {
                item.classList.add('active');
            }
        });
    }

    updateSectionTitle() {
        const sectionTitle = document.getElementById('sectionTitle');
        const platformNames = {
            android: 'Android',
            windows: 'Windows',
            iphone: 'iPhone'
        };
        
        if (sectionTitle) {
            sectionTitle.textContent = `Mods para ${platformNames[this.currentPlatform]}`;
        }
    }

    async loadMods() {
        try {
            this.showLoading();
            this.mods = await getMods();
            this.filterModsByPlatform();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading mods:', error);
            this.showError('Error al cargar los mods');
            this.hideLoading();
        }
    }

    filterModsByPlatform() {
        const platformMap = {
            android: 'Android',
            windows: 'Windows',
            iphone: 'iPhone'
        };
        
        this.filteredMods = this.mods.filter(mod => 
            mod.platform === platformMap[this.currentPlatform]
        );
        this.updateModsCount();
    }

    filterMods(searchTerm) {
        if (!searchTerm.trim()) {
            this.filterModsByPlatform();
        } else {
            const platformMap = {
                android: 'Android',
                windows: 'Windows',
                iphone: 'iPhone'
            };
            
            this.filteredMods = this.mods.filter(mod => 
                mod.platform === platformMap[this.currentPlatform] &&
                (mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 mod.developer.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        this.updateModsCount();
        this.renderMods();
    }

    updateModsCount() {
        const modsCount = document.getElementById('modsCount');
        if (modsCount) {
            const count = this.filteredMods.length;
            modsCount.textContent = `${count} mod${count !== 1 ? 's' : ''} disponible${count !== 1 ? 's' : ''}`;
        }
    }

    showLoading() {
        const modsGrid = document.getElementById('modsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (modsGrid) {
            modsGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando mods...</p>
                </div>
            `;
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    hideLoading() {
        this.renderMods();
    }

    showError(message) {
        const modsGrid = document.getElementById('modsGrid');
        if (modsGrid) {
            modsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    renderMods() {
        const modsGrid = document.getElementById('modsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!modsGrid) return;

        if (this.filteredMods.length === 0) {
            modsGrid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        modsGrid.innerHTML = this.filteredMods.map(mod => this.createModCard(mod)).join('');
        
        const modCards = modsGrid.querySelectorAll('.mod-card');
        modCards.forEach(card => {
            card.addEventListener('click', () => {
                const modId = parseInt(card.dataset.modId);
                this.openModModal(modId);
            });
        });
    }

    createModCard(mod) {
        const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+CiAgPHBhdGggZD0iTTcgMTJMMTcgMTIiPjwvcGF0aD4KPC9zdmc+';
        
        return `
            <div class="mod-card" data-mod-id="${mod.id}">
                <div class="mod-card-content">
                    <img src="${mod.icon_url || defaultIcon}" alt="${mod.name}" class="mod-icon" onerror="this.src='${defaultIcon}'">
                    <div class="mod-info">
                        <h3 class="mod-name">${this.escapeHtml(mod.name)}</h3>
                        <div class="mod-meta">
                            <span class="mod-developer">${this.escapeHtml(mod.developer)}</span>
                            <span class="mod-version">${this.escapeHtml(mod.version)}</span>
                        </div>
                        <div class="mod-size-info">
                            <svg class="size-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7,10 12,15 17,10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>${this.escapeHtml(mod.size)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async openModModal(modId) {
        try {
            const mod = await getModById(modId);
            if (!mod) {
                console.error('Mod not found');
                return;
            }

            this.showModModal(mod);
            
            const url = new URL(window.location);
            url.searchParams.set('id', modId.toString());
            window.history.pushState({}, '', url);
        } catch (error) {
            console.error('Error loading mod details:', error);
        }
    }

    showModModal(mod) {
        const modal = document.getElementById('modModal');
        const modalIcon = document.getElementById('modalIcon');
        const modalTitle = document.getElementById('modalTitle');
        const modalDeveloper = document.getElementById('modalDeveloper');
        const modalVersion = document.getElementById('modalVersion');
        const modalPlatform = document.getElementById('modalPlatform');
        const modalSize = document.getElementById('modalSize');
        const modalDescription = document.getElementById('modalDescription');
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadPlatform = document.getElementById('downloadPlatform');

        const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+CiAgPHBhdGggZD0iTTcgMTJMMTcgMTIiPjwvcGF0aD4KPC9zdmc+';

        if (modalIcon) modalIcon.src = mod.icon_url || defaultIcon;
        if (modalTitle) modalTitle.textContent = mod.name;
        if (modalDeveloper) modalDeveloper.textContent = mod.developer;
        if (modalVersion) modalVersion.textContent = mod.version;
        if (modalPlatform) modalPlatform.textContent = mod.platform;
        if (modalSize) modalSize.textContent = mod.size;
        if (modalDescription) modalDescription.textContent = mod.description || 'No hay descripción disponible.';
        if (downloadPlatform) downloadPlatform.textContent = mod.platform;

        if (downloadBtn) {
            downloadBtn.onclick = () => {
                if (mod.download_link) {
                    window.open(mod.download_link, '_blank');
                }
            };
        }

        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('modModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        const url = new URL(window.location);
        url.searchParams.set('id', 'apkmods');
        window.history.pushState({}, '', url);
    }

    updateUI() {
        this.updateActiveNavItem();
        this.updateSectionTitle();
        this.renderMods();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ApkModsApp();
});
