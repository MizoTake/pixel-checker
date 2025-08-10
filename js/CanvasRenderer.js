class CanvasRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        this.currentImage = null;
        this.zoomLevel = 1.0;
        this.baseScale = 1.0;
        this.originalWidth = 0;
        this.originalHeight = 0;
        
        // Drag scrolling state
        this.isDragging = false;
        this.lastPointerX = 0;
        this.lastPointerY = 0;
        
        this._setupDragScrolling();
    }

    drawImage(image) {
        if (!image) {
            throw new Error('Image is required for drawing');
        }

        this.currentImage = image;
        this.originalWidth = image.width;
        this.originalHeight = image.height;
        this.resize(image.width, image.height);
        
        try {
            this.ctx.drawImage(image, 0, 0);
        } catch (error) {
            throw new Error(`Failed to draw image: ${error.message}`);
        }
    }

    getImageData() {
        if (!this.currentImage) {
            throw new Error('No image has been drawn to canvas');
        }

        try {
            return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
            throw new Error(`Failed to get image data: ${error.message}`);
        }
    }

    putImageData(imageData) {
        if (!imageData || !(imageData instanceof ImageData)) {
            throw new Error('Valid ImageData object is required');
        }

        try {
            this.ctx.putImageData(imageData, 0, 0);
        } catch (error) {
            throw new Error(`Failed to put image data: ${error.message}`);
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentImage = null;
    }

    resize(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error('Canvas dimensions must be positive');
        }

        // Set canvas size to actual image dimensions
        this.canvas.width = width;
        this.canvas.height = height;

        // Calculate initial scale to fit container while maintaining aspect ratio
        this.calculateInitialScale();
        
        // Apply zoom level to CSS dimensions
        this.applyZoom();
    }

    calculateInitialScale() {
        const container = this.canvas.parentElement;
        if (!container) return;

        // Get container dimensions
        const containerWidth = container.clientWidth || window.innerWidth * 0.9;
        const containerHeight = Math.min(600, window.innerHeight * 0.7);

        // Calculate scale to fit within container
        const scaleX = containerWidth / this.originalWidth;
        const scaleY = containerHeight / this.originalHeight;
        
        // Use the smaller scale to ensure the image fits entirely
        this.baseScale = Math.min(scaleX, scaleY, 1.0);
    }

    setZoom(zoomLevel) {
        this.zoomLevel = Math.max(0.1, Math.min(10.0, zoomLevel));
        this.applyZoom();
        
        // Toggle zoomed class for styling based on effective scale
        const wrapper = this.canvas.parentElement;
        const effectiveScale = this.baseScale * this.zoomLevel;
        
        // Consider zoomed if the effective scale makes the image larger than container
        const containerWidth = wrapper ? wrapper.clientWidth : window.innerWidth * 0.9;
        const containerHeight = wrapper ? Math.min(600, window.innerHeight * 0.7) : 400;
        
        const displayWidth = this.originalWidth * effectiveScale;
        const displayHeight = this.originalHeight * effectiveScale;
        
        const needsScroll = displayWidth > containerWidth || displayHeight > containerHeight;
        
        if (needsScroll) {
            wrapper.classList.add('zoomed');
        } else {
            wrapper.classList.remove('zoomed');
        }
    }

    applyZoom() {
        if (this.originalWidth && this.originalHeight) {
            // Apply both base scale and zoom level
            const effectiveScale = this.baseScale * this.zoomLevel;
            const displayWidth = this.originalWidth * effectiveScale;
            const displayHeight = this.originalHeight * effectiveScale;
            
            this.canvas.style.width = `${displayWidth}px`;
            this.canvas.style.height = `${displayHeight}px`;
        }
    }

    getZoom() {
        return this.zoomLevel;
    }

    zoomIn() {
        this.setZoom(this.zoomLevel * 1.25);
    }

    zoomOut() {
        this.setZoom(this.zoomLevel / 1.25);
    }

    resetZoom() {
        this.setZoom(1.0);
    }

    toBlob(callback, type = 'image/png', quality = 1.0) {
        if (!this.currentImage) {
            throw new Error('No image on canvas to export');
        }

        this.canvas.toBlob(callback, type, quality);
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    getCurrentImage() {
        return this.currentImage;
    }

    _setupDragScrolling() {
        const wrapper = this.canvas.parentElement;
        if (!wrapper) return;

        // Mouse events
        wrapper.addEventListener('mousedown', (e) => {
            this._startDrag(e.clientX, e.clientY);
        });

        document.addEventListener('mousemove', (e) => {
            this._handleDrag(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', () => {
            this._endDrag();
        });

        // Touch events for mobile
        wrapper.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._startDrag(touch.clientX, touch.clientY);
        }, { passive: false });

        wrapper.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this._handleDrag(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        wrapper.addEventListener('touchend', (e) => {
            e.preventDefault();
            this._endDrag();
        }, { passive: false });

        // Prevent context menu on right click
        wrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    _startDrag(x, y) {
        const wrapper = this.canvas.parentElement;
        if (!wrapper) return;

        // Only enable dragging if content is larger than container
        const canScroll = wrapper.scrollWidth > wrapper.clientWidth || 
                         wrapper.scrollHeight > wrapper.clientHeight;

        if (canScroll) {
            this.isDragging = true;
            this.lastPointerX = x;
            this.lastPointerY = y;
            wrapper.style.cursor = 'grabbing';
            
            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
        }
    }

    _handleDrag(x, y) {
        if (!this.isDragging) return;

        const wrapper = this.canvas.parentElement;
        if (!wrapper) return;

        const deltaX = this.lastPointerX - x;
        const deltaY = this.lastPointerY - y;

        wrapper.scrollLeft += deltaX;
        wrapper.scrollTop += deltaY;

        this.lastPointerX = x;
        this.lastPointerY = y;
    }

    _endDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            const wrapper = this.canvas.parentElement;
            if (wrapper) {
                wrapper.style.cursor = '';
            }
            
            // Restore text selection
            document.body.style.userSelect = '';
        }
    }
}