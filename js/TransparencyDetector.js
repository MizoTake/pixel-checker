class TransparencyDetector {
    detectTransparentPixels(imageData, mode = 'all') {
        if (mode === 'contour') {
            return this.detectContourTransparentPixels(imageData);
        } else {
            return this.detectAllTransparentPixels(imageData);
        }
    }

    detectAllTransparentPixels(imageData) {
        const transparentPixels = [];
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Iterate through all pixels (4 values per pixel: R, G, B, A)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const alpha = data[index + 3];

                // Check if pixel is transparent (alpha < 255)
                if (alpha < 255) {
                    transparentPixels.push({ x, y, alpha });
                }
            }
        }

        return transparentPixels;
    }

    detectContourTransparentPixels(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Step 1: Find the contour of non-transparent areas
        const contour = this.findImageContour(imageData);
        
        // Step 2: Find transparent pixels within the contour
        const transparentPixels = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const alpha = data[index + 3];
                
                // Check if pixel is transparent and within contour
                if (alpha < 255 && this.isPointInsideContour(x, y, contour, width, height)) {
                    transparentPixels.push({ x, y, alpha });
                }
            }
        }
        
        return transparentPixels;
    }

    findImageContour(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Create a binary mask of non-transparent pixels
        const mask = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const alpha = data[i * 4 + 3];
            mask[i] = alpha > 128 ? 1 : 0; // Consider semi-transparent as non-transparent
        }
        
        // Find bounding box of non-transparent areas
        let minX = width, maxX = -1, minY = height, maxY = -1;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                if (mask[index] === 1) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        // If no non-transparent pixels found, return empty contour
        if (maxX === -1) {
            return { bounds: null, mask };
        }
        
        // Create contour bounds with some padding to catch inner transparent areas
        const padding = Math.max(2, Math.min(width, height) * 0.02);
        const bounds = {
            minX: Math.max(0, minX - padding),
            maxX: Math.min(width - 1, maxX + padding),
            minY: Math.max(0, minY - padding),
            maxY: Math.min(height - 1, maxY + padding)
        };
        
        return { bounds, mask };
    }

    isPointInsideContour(x, y, contour, width, height) {
        if (!contour.bounds) return false;
        
        const { minX, maxX, minY, maxY } = contour.bounds;
        
        // Simple bounding box check first
        if (x < minX || x > maxX || y < minY || y > maxY) {
            return false;
        }
        
        // Check if there are non-transparent pixels around this point
        // This helps identify "holes" within the image content
        const searchRadius = 5;
        let hasNonTransparentNeighbor = false;
        
        for (let dy = -searchRadius; dy <= searchRadius && !hasNonTransparentNeighbor; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius && !hasNonTransparentNeighbor; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const index = ny * width + nx;
                    if (contour.mask[index] === 1) {
                        hasNonTransparentNeighbor = true;
                    }
                }
            }
        }
        
        return hasNonTransparentNeighbor;
    }

    hasTransparency(imageData, mode = 'all') {
        if (mode === 'contour') {
            const transparentPixels = this.detectContourTransparentPixels(imageData);
            return transparentPixels.length > 0;
        } else {
            return this.hasAllTransparency(imageData);
        }
    }

    hasAllTransparency(imageData) {
        const data = imageData.data;
        
        // Quick check: iterate through alpha channel only
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
                return true;
            }
        }
        
        return false;
    }

    getTransparencyMask(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const mask = new Uint8Array(width * height);

        // Create a binary mask: 0 = opaque, 1 = has transparency
        for (let i = 0; i < width * height; i++) {
            const alpha = data[i * 4 + 3];
            mask[i] = alpha < 255 ? 1 : 0;
        }

        return mask;
    }

    getTransparencyStats(imageData) {
        const data = imageData.data;
        const totalPixels = imageData.width * imageData.height;
        let transparentCount = 0;
        let semiTransparentCount = 0;
        let fullyTransparentCount = 0;

        for (let i = 3; i < data.length; i += 4) {
            const alpha = data[i];
            
            if (alpha < 255) {
                transparentCount++;
                
                if (alpha === 0) {
                    fullyTransparentCount++;
                } else {
                    semiTransparentCount++;
                }
            }
        }

        return {
            totalPixels,
            transparentCount,
            semiTransparentCount,
            fullyTransparentCount,
            transparentPercentage: (transparentCount / totalPixels) * 100,
            hasTransparency: transparentCount > 0
        };
    }

    createTransparencyVisualization(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const visualData = new ImageData(width, height);
        const srcData = imageData.data;
        const dstData = visualData.data;

        // Create a visual representation where transparent areas are highlighted
        for (let i = 0; i < srcData.length; i += 4) {
            const alpha = srcData[i + 3];
            
            if (alpha < 255) {
                // Highlight transparent areas with a checkerboard pattern
                const pixelIndex = i / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);
                const isEven = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) === 0;
                
                // Semi-transparent: show original with checkerboard
                if (alpha > 0) {
                    dstData[i] = srcData[i];
                    dstData[i + 1] = srcData[i + 1];
                    dstData[i + 2] = srcData[i + 2];
                    dstData[i + 3] = srcData[i + 3];
                } else {
                    // Fully transparent: show checkerboard
                    const color = isEven ? 200 : 240;
                    dstData[i] = color;
                    dstData[i + 1] = color;
                    dstData[i + 2] = color;
                    dstData[i + 3] = 255;
                }
            } else {
                // Opaque pixels: copy as-is
                dstData[i] = srcData[i];
                dstData[i + 1] = srcData[i + 1];
                dstData[i + 2] = srcData[i + 2];
                dstData[i + 3] = srcData[i + 3];
            }
        }

        return visualData;
    }
}