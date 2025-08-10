class PixelProcessor {
    fillTransparentPixels(imageData, fillColor, transparentPixels = null) {
        // Create a copy to avoid modifying the original
        const processedData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );

        const data = processedData.data;
        const { r, g, b } = fillColor;
        const width = imageData.width;

        // If specific transparent pixels are provided, only fill those
        if (transparentPixels && transparentPixels.length > 0) {
            for (const pixel of transparentPixels) {
                const index = (pixel.y * width + pixel.x) * 4;
                const alpha = pixel.alpha;

                if (alpha === 0) {
                    // Fully transparent: replace with fill color
                    data[index] = r;
                    data[index + 1] = g;
                    data[index + 2] = b;
                    data[index + 3] = 255;
                } else {
                    // Semi-transparent: blend with fill color
                    const alphaRatio = alpha / 255;
                    const inverseAlpha = 1 - alphaRatio;

                    data[index] = Math.round(data[index] * alphaRatio + r * inverseAlpha);
                    data[index + 1] = Math.round(data[index + 1] * alphaRatio + g * inverseAlpha);
                    data[index + 2] = Math.round(data[index + 2] * alphaRatio + b * inverseAlpha);
                    data[index + 3] = 255;
                }
            }
        } else {
            // Process each pixel (original behavior)
            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];

                // If pixel has transparency
                if (alpha < 255) {
                    if (alpha === 0) {
                        // Fully transparent: replace with fill color
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                        data[i + 3] = 255;
                    } else {
                        // Semi-transparent: blend with fill color
                        const alphaRatio = alpha / 255;
                        const inverseAlpha = 1 - alphaRatio;

                        data[i] = Math.round(data[i] * alphaRatio + r * inverseAlpha);
                        data[i + 1] = Math.round(data[i + 1] * alphaRatio + g * inverseAlpha);
                        data[i + 2] = Math.round(data[i + 2] * alphaRatio + b * inverseAlpha);
                        data[i + 3] = 255;
                    }
                }
            }
        }

        return processedData;
    }

    applyColorToTransparentAreas(canvas, color) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const fillColor = this.hexToRgb(color);
        
        const processedData = this.fillTransparentPixels(imageData, fillColor);
        ctx.putImageData(processedData, 0, 0);
        
        return processedData;
    }

    preserveOriginalPixels(imageData) {
        // Create a deep copy of the image data
        return new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
    }

    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse hex values
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return { r, g, b };
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    blendColors(foreground, background, alpha) {
        // Alpha blending formula: result = foreground * alpha + background * (1 - alpha)
        const blended = {
            r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
            g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
            b: Math.round(foreground.b * alpha + background.b * (1 - alpha))
        };
        
        return blended;
    }

    createPreviewWithTransparencyMask(imageData, transparencyMask, fillColor) {
        const previewData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );

        const data = previewData.data;
        const { r, g, b } = fillColor;

        // Apply fill color only to transparent areas based on mask
        for (let i = 0; i < transparencyMask.length; i++) {
            if (transparencyMask[i] === 1) {
                const pixelIndex = i * 4;
                const alpha = data[pixelIndex + 3] / 255;
                
                if (alpha < 1) {
                    const blended = this.blendColors(
                        { r: data[pixelIndex], g: data[pixelIndex + 1], b: data[pixelIndex + 2] },
                        { r, g, b },
                        alpha
                    );
                    
                    data[pixelIndex] = blended.r;
                    data[pixelIndex + 1] = blended.g;
                    data[pixelIndex + 2] = blended.b;
                    data[pixelIndex + 3] = 255;
                }
            }
        }

        return previewData;
    }
}