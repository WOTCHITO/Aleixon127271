import { supabase, createMod } from './supabase.js';

const imgbbApiKey = 'a829ef97aa2f2e24d7871d6b3ef0b52e';

async function uploadImageToImgBB(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`ImgBB upload failed: ${errorData.error.message}`);
        }

        const result = await response.json();
        return result.data.url;
    } catch (error) {
        console.error('Error uploading to ImgBB:', error);
        throw error;
    }
}

class ModFormHandler {
    constructor() {
        this.selectedFile = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFileUpload();
    }

    setupEventListeners() {
        const form = document.getElementById('modForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    setupFileUpload() {
        const fileInput = document.getElementById('iconFile');
        const uploadArea = document.getElementById('fileUploadArea');
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadPlaceholder = uploadArea.querySelector('.upload-placeholder');
        const removeFileBtn = document.getElementById('removeFile');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelect(file);
                }
            });
        }

        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    if (this.isValidImageFile(file)) {
                        this.handleFileSelect(file);
                        fileInput.files = files;
                    }
                }
            });
        }

        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                this.removeSelectedFile();
            });
        }
    }

    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;

        if (!validTypes.includes(file.type)) {
            this.showError('Por favor selecciona un archivo de imagen válido (PNG, JPG, GIF, WebP)');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('El archivo es demasiado grande. El tamaño máximo es 5MB');
            return false;
        }

        return true;
    }

    handleFileSelect(file) {
        if (!this.isValidImageFile(file)) {
            return;
        }

        this.selectedFile = file;
        this.showFilePreview(file);
    }

    showFilePreview(file) {
        const uploadArea = document.getElementById('fileUploadArea');
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadPlaceholder = uploadArea.querySelector('.upload-placeholder');
        const previewImage = document.getElementById('previewImage');
        const fileName = document.getElementById('fileName');

        if (uploadPlaceholder) {
            uploadPlaceholder.style.display = 'none';
        }

        if (uploadPreview) {
            uploadPreview.style.display = 'flex';
        }

        if (previewImage && fileName) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
            fileName.textContent = file.name;
        }
    }

    removeSelectedFile() {
        const fileInput = document.getElementById('iconFile');
        const uploadArea = document.getElementById('fileUploadArea');
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadPlaceholder = uploadArea.querySelector('.upload-placeholder');

        this.selectedFile = null;
        
        if (fileInput) {
            fileInput.value = '';
        }

        if (uploadPreview) {
            uploadPreview.style.display = 'none';
        }

        if (uploadPlaceholder) {
            uploadPlaceholder.style.display = 'flex';
        }
    }

    async handleFormSubmit() {
        try {
            this.setLoading(true);
            
            const formData = this.getFormData();
            
            if (!this.validateFormData(formData)) {
                this.setLoading(false);
                return;
            }

            let iconUrl = null;
            if (this.selectedFile) {
                iconUrl = await this.uploadIcon();
            }

            const modData = {
                name: formData.appName,
                developer: formData.developer,
                download_link: formData.downloadLink,
                version: formData.version,
                platform: formData.platform,
                size: formData.size,
                description: formData.description,
                icon_url: iconUrl
            };

            const createdMod = await createMod(modData);
            
            this.showSuccess('¡Mod publicado exitosamente!');
            
            setTimeout(() => {
                window.location.href = `index.html?section=${formData.platform.toLowerCase()}&id=apkmods`;
            }, 2000);

        } catch (error) {
            console.error('Error creating mod:', error);
            this.showError('Error al publicar el mod. Por favor intenta de nuevo.');
            this.setLoading(false);
        }
    }

    getFormData() {
        return {
            appName: document.getElementById('appName').value.trim(),
            developer: document.getElementById('developer').value.trim(),
            downloadLink: document.getElementById('downloadLink').value.trim(),
            version: document.getElementById('version').value.trim(),
            platform: document.getElementById('platform').value,
            size: document.getElementById('size').value.trim(),
            description: document.getElementById('description').value.trim()
        };
    }

    validateFormData(formData) {
        const requiredFields = [
            { field: 'appName', name: 'Nombre de la aplicación' },
            { field: 'developer', name: 'Desarrollador' },
            { field: 'downloadLink', name: 'Link de descarga' },
            { field: 'version', name: 'Versión' },
            { field: 'platform', name: 'Plataforma' },
            { field: 'size', name: 'Tamaño' },
            { field: 'description', name: 'Descripción' }
        ];

        for (const { field, name } of requiredFields) {
            if (!formData[field]) {
                this.showError(`El campo "${name}" es requerido`);
                return false;
            }
        }

        if (!this.isValidUrl(formData.downloadLink)) {
            this.showError('Por favor ingresa un link de descarga válido');
            return false;
        }

        if (!this.selectedFile) {
            this.showError('Por favor selecciona una imagen para el icono');
            return false;
        }

        return true;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async uploadIcon() {
        if (!this.selectedFile) {
            throw new Error('No file selected');
        }
        
        return await uploadImageToImgBB(this.selectedFile);
    }

    setLoading(isLoading) {
        const publishBtn = document.getElementById('publishBtn');
        const btnText = publishBtn.querySelector('.btn-text');
        const btnLoading = publishBtn.querySelector('.btn-loading');

        if (isLoading) {
            publishBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            publishBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        const styles = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-error {
                background: #ff4757;
                color: white;
            }
            
            .notification-success {
                background: #3ecf8e;
                color: white;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        if (!document.querySelector('#notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'notification-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        document.body.appendChild(notification);

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ModFormHandler();
});

