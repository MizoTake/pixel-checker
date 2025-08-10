class ImageManager {
    constructor() {
        this.images = new Map();
        this.currentImageId = null;
        this.imageIdCounter = 0;
    }

    async addImages(files) {
        const validFormats = ['image/png', 'image/gif', 'image/webp'];
        const addedImages = [];
        const errors = [];

        for (const file of files) {
            // Validate file format
            if (!validFormats.includes(file.type)) {
                errors.push(`${file.name}: サポートされていない形式です`);
                continue;
            }

            try {
                const imageData = await this._loadImage(file);
                const id = this._generateId();
                
                this.images.set(id, {
                    id,
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    imageElement: imageData.image,
                    thumbnail: imageData.thumbnail,
                    width: imageData.image.width,
                    height: imageData.image.height,
                    hasTransparency: false,
                    transparentPixels: [],
                    currentFillColor: '#ffffff',
                    originalImageData: null,
                    processedImageData: null
                });

                addedImages.push(id);

                // Set first image as current if none selected
                if (!this.currentImageId && addedImages.length === 1) {
                    this.currentImageId = id;
                }
            } catch (error) {
                errors.push(`${file.name}: 読み込みエラー - ${error.message}`);
            }
        }

        return { addedImages, errors };
    }

    getCurrentImage() {
        if (!this.currentImageId || !this.images.has(this.currentImageId)) {
            return null;
        }
        return this.images.get(this.currentImageId);
    }

    switchToImage(imageId) {
        if (!this.images.has(imageId)) {
            throw new Error('指定された画像が見つかりません');
        }
        this.currentImageId = imageId;
    }

    getImageCount() {
        return this.images.size;
    }

    getImageList() {
        return Array.from(this.images.values()).map(img => ({
            id: img.id,
            name: img.name,
            thumbnail: img.thumbnail,
            hasTransparency: img.hasTransparency,
            currentFillColor: img.currentFillColor
        }));
    }

    updateImageData(imageId, updates) {
        if (!this.images.has(imageId)) {
            throw new Error('指定された画像が見つかりません');
        }

        const image = this.images.get(imageId);
        Object.assign(image, updates);
    }

    reset() {
        // Revoke object URLs to free memory
        for (const image of this.images.values()) {
            if (image.thumbnail) {
                URL.revokeObjectURL(image.thumbnail);
            }
        }

        this.images.clear();
        this.currentImageId = null;
        this.imageIdCounter = 0;
    }

    _generateId() {
        return `img_${++this.imageIdCounter}_${Date.now()}`;
    }

    async _loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Create thumbnail
                    const thumbnailCanvas = document.createElement('canvas');
                    const thumbnailCtx = thumbnailCanvas.getContext('2d');
                    const maxSize = 80;
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    
                    thumbnailCanvas.width = width;
                    thumbnailCanvas.height = height;
                    thumbnailCtx.drawImage(img, 0, 0, width, height);
                    
                    thumbnailCanvas.toBlob((blob) => {
                        const thumbnailUrl = URL.createObjectURL(blob);
                        resolve({
                            image: img,
                            thumbnail: thumbnailUrl
                        });
                    });
                };
                
                img.onerror = () => {
                    reject(new Error('画像の読み込みに失敗しました'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsDataURL(file);
        });
    }
}