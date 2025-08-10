class UIController {
    constructor() {
        this.imageManager = new ImageManager();
        this.canvasRenderer = null;
        this.transparencyDetector = new TransparencyDetector();
        this.pixelProcessor = new PixelProcessor();
        
        this.elements = {
            fileInput: null,
            uploadLabel: null,
            colorPicker: null,
            colorValue: null,
            detectionMode: null,
            zoomInButton: null,
            zoomOutButton: null,
            zoomResetButton: null,
            zoomLevel: null,
            resetButton: null,
            downloadButton: null,
            workspace: null,
            imageList: null,
            canvas: null,
            transparencyStatus: null,
            errorMessage: null,
            successMessage: null
        };

        this.currentColor = '#ffffff';
        this.debounceTimer = null;
    }

    init() {
        this._getElements();
        this._setupCanvas();
        this._setupEventListeners();
        this._setupDragAndDrop();
    }

    _getElements() {
        this.elements.fileInput = document.getElementById('fileInput');
        this.elements.uploadLabel = document.querySelector('.upload-label');
        this.elements.colorPicker = document.getElementById('colorPicker');
        this.elements.colorValue = document.getElementById('colorValue');
        this.elements.detectionMode = document.getElementById('detectionMode');
        this.elements.zoomInButton = document.getElementById('zoomInButton');
        this.elements.zoomOutButton = document.getElementById('zoomOutButton');
        this.elements.zoomResetButton = document.getElementById('zoomResetButton');
        this.elements.zoomLevel = document.getElementById('zoomLevel');
        this.elements.resetButton = document.getElementById('resetButton');
        this.elements.downloadButton = document.getElementById('downloadButton');
        this.elements.workspace = document.getElementById('workspace');
        this.elements.imageList = document.getElementById('imageList');
        this.elements.canvas = document.getElementById('canvas');
        this.elements.transparencyStatus = document.getElementById('transparencyStatus');
        this.elements.errorMessage = document.getElementById('errorMessage');
        this.elements.successMessage = document.getElementById('successMessage');
    }

    _setupCanvas() {
        this.canvasRenderer = new CanvasRenderer(this.elements.canvas);
    }

    _setupEventListeners() {
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        this.elements.colorPicker.addEventListener('input', (e) => {
            this.handleColorChange(e.target.value);
        });

        this.elements.detectionMode.addEventListener('change', (e) => {
            this.handleDetectionModeChange(e.target.value);
        });

        this.elements.zoomInButton.addEventListener('click', () => {
            this.handleZoomIn();
        });

        this.elements.zoomOutButton.addEventListener('click', () => {
            this.handleZoomOut();
        });

        this.elements.zoomResetButton.addEventListener('click', () => {
            this.handleZoomReset();
        });

        this.elements.resetButton.addEventListener('click', () => {
            this.handleReset();
        });

        this.elements.downloadButton.addEventListener('click', () => {
            this.handleDownload();
        });
    }

    _setupDragAndDrop() {
        const uploadArea = document.querySelector('.upload-area');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files);
            }
        });
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        this.showMessage('画像を読み込んでいます...', 'success');
        
        const result = await this.imageManager.addImages(files);
        
        if (result.errors.length > 0) {
            this.showError(result.errors.join('\n'));
        }

        if (result.addedImages.length > 0) {
            this.showMessage(`${result.addedImages.length}個の画像を読み込みました`, 'success');
            this.updateImageList();
            this.showWorkspace();
            this.displayCurrentImage();
        }
    }

    handleImageSwitch(imageId) {
        try {
            this.imageManager.switchToImage(imageId);
            this.displayCurrentImage();
            this.updateImageList();
        } catch (error) {
            this.showError(error.message);
        }
    }

    handleColorChange(color) {
        this.currentColor = color;
        this.elements.colorValue.textContent = color;

        // Debounce color updates for performance
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.applyColorToCurrentImage();
        }, 100);
    }

    handleDetectionModeChange(mode) {
        // Re-process current image with new detection mode
        this.displayCurrentImage();
    }

    handleZoomIn() {
        this.canvasRenderer.zoomIn();
        this.updateZoomDisplay();
    }

    handleZoomOut() {
        this.canvasRenderer.zoomOut();
        this.updateZoomDisplay();
    }

    handleZoomReset() {
        this.canvasRenderer.resetZoom();
        this.updateZoomDisplay();
    }

    updateZoomDisplay() {
        const zoomPercent = Math.round(this.canvasRenderer.getZoom() * 100);
        this.elements.zoomLevel.textContent = `${zoomPercent}%`;
    }

    handleReset() {
        if (confirm('すべての画像と設定をリセットしますか？')) {
            this.imageManager.reset();
            this.canvasRenderer.clear();
            this.hideWorkspace();
            this.elements.fileInput.value = '';
            this.currentColor = '#ffffff';
            this.elements.colorPicker.value = '#ffffff';
            this.elements.colorValue.textContent = '#ffffff';
            this.showMessage('リセットしました', 'success');
        }
    }

    handleDownload() {
        const currentImage = this.imageManager.getCurrentImage();
        if (!currentImage) return;

        this.canvasRenderer.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Generate filename
            const originalName = currentImage.name.replace(/\.[^/.]+$/, '');
            const extension = currentImage.hasTransparency ? '.png' : currentImage.name.split('.').pop();
            a.download = `${originalName}_filled.${extension}`;
            
            a.click();
            URL.revokeObjectURL(url);
            
            this.showMessage('ダウンロードを開始しました', 'success');
        }, currentImage.type === 'image/png' ? 'image/png' : 'image/png');
    }

    displayCurrentImage() {
        const currentImage = this.imageManager.getCurrentImage();
        if (!currentImage) return;

        try {
            // Draw the image
            this.canvasRenderer.drawImage(currentImage.imageElement);
            
            // Get and store original image data
            const originalImageData = this.canvasRenderer.getImageData();
            this.imageManager.updateImageData(currentImage.id, {
                originalImageData: this.pixelProcessor.preserveOriginalPixels(originalImageData)
            });

            // Get current detection mode
            const detectionMode = this.elements.detectionMode.value;
            
            // Detect transparency based on selected mode
            const hasTransparency = this.transparencyDetector.hasTransparency(originalImageData, detectionMode);
            const transparentPixels = hasTransparency ? 
                this.transparencyDetector.detectTransparentPixels(originalImageData, detectionMode) : [];
            
            this.imageManager.updateImageData(currentImage.id, {
                hasTransparency,
                transparentPixels,
                detectionMode
            });

            // Update transparency status display
            this.updateTransparencyStatus(hasTransparency, transparentPixels.length, detectionMode);

            // Apply color if there's transparency
            if (hasTransparency) {
                this.applyColorToCurrentImage();
                this.elements.downloadButton.disabled = false;
            } else {
                this.elements.downloadButton.disabled = true;
                this.showMessage('この画像には透明ピクセルがありません', 'success');
            }

            // Reset zoom and update display
            this.canvasRenderer.resetZoom();
            this.updateZoomDisplay();
        } catch (error) {
            this.showError(`画像の処理中にエラーが発生しました: ${error.message}`);
        }
    }

    applyColorToCurrentImage() {
        const currentImage = this.imageManager.getCurrentImage();
        if (!currentImage || !currentImage.hasTransparency) return;

        const fillColor = this.pixelProcessor.hexToRgb(this.currentColor);
        const processedData = this.pixelProcessor.fillTransparentPixels(
            currentImage.originalImageData,
            fillColor,
            currentImage.transparentPixels
        );

        this.canvasRenderer.putImageData(processedData);
        
        this.imageManager.updateImageData(currentImage.id, {
            processedImageData: processedData,
            currentFillColor: this.currentColor
        });
    }

    updateTransparencyStatus(hasTransparency, pixelCount, mode) {
        const statusElement = this.elements.transparencyStatus;
        const statusText = document.getElementById('transparencyStatusText');
        
        if (hasTransparency) {
            statusElement.style.display = 'flex';
            
            let modeText = '';
            if (mode === 'contour') {
                modeText = '輪郭内の';
            }
            
            statusText.textContent = `${modeText}透明ピクセルが${pixelCount.toLocaleString()}個検出されました`;
        } else {
            statusElement.style.display = 'none';
        }
    }

    updateImageList() {
        const images = this.imageManager.getImageList();
        this.elements.imageList.innerHTML = '';

        images.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            if (image.id === this.imageManager.currentImageId) {
                imageItem.classList.add('active');
            }

            const img = document.createElement('img');
            img.src = image.thumbnail;
            img.alt = image.name;
            img.title = image.name;

            imageItem.appendChild(img);
            imageItem.addEventListener('click', () => {
                this.handleImageSwitch(image.id);
            });

            this.elements.imageList.appendChild(imageItem);
        });
    }

    showWorkspace() {
        this.elements.workspace.style.display = 'block';
    }

    hideWorkspace() {
        this.elements.workspace.style.display = 'none';
    }

    showMessage(message, type) {
        const element = type === 'error' ? this.elements.errorMessage : this.elements.successMessage;
        element.textContent = message;
        element.style.display = 'block';

        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }
}