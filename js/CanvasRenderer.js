class CanvasRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        this.currentImage = null;
        this.zoomLevel = 1.0;
        this.originalWidth = 0;
        this.originalHeight = 0;
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

        // Apply zoom level to CSS dimensions
        this.applyZoom();
    }

    setZoom(zoomLevel) {
        this.zoomLevel = Math.max(0.1, Math.min(5.0, zoomLevel));
        this.applyZoom();
        
        // Toggle zoomed class for styling
        const wrapper = this.canvas.parentElement;
        if (this.zoomLevel > 1.0) {
            wrapper.classList.add('zoomed');
        } else {
            wrapper.classList.remove('zoomed');
        }
    }

    applyZoom() {
        if (this.originalWidth && this.originalHeight) {
            const displayWidth = this.originalWidth * this.zoomLevel;
            const displayHeight = this.originalHeight * this.zoomLevel;
            
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
}