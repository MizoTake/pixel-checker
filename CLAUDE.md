# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development Server
```bash
# Recommended method (uses npm scripts)
npm install         # First time setup
npm start          # Start server (uses http-server)
npm run dev        # Development with live reload

# Cross-platform startup scripts (fallback)
./start.sh         # Mac/Linux (prioritizes npm)
start.bat          # Windows (prioritizes npm)

# Alternative direct commands
npm run serve      # http-server with cache disabled
npm run setup      # Install deps and show usage
```

### Testing
- Open `test.html` to generate transparent test images
- No automated tests - manual testing via browser

## Architecture Overview

This is a client-side image processing web application built with vanilla JavaScript and Canvas API. The application follows a modular class-based architecture:

### Core Architecture Pattern
The application uses a **Component-Controller Architecture** where:
- `UIController` orchestrates all interactions between components
- Individual classes handle specific concerns (image management, pixel processing, rendering)
- All processing happens client-side for performance

### Key Components Flow
```
UIController (main orchestrator)
├── ImageManager (handles multiple image state)
├── CanvasRenderer (Canvas API wrapper)  
├── TransparencyDetector (alpha channel analysis)
└── PixelProcessor (pixel manipulation algorithms)
```

### Critical Implementation Details

**Image Processing Pipeline:**
1. `ImageManager.addImages()` - validates and stores multiple images with metadata
2. `CanvasRenderer.drawImage()` - renders to canvas with responsive scaling
3. `TransparencyDetector.hasTransparency()` - analyzes alpha channel
4. `PixelProcessor.fillTransparentPixels()` - applies color fill with alpha blending

**Performance Optimizations:**
- Canvas context uses `{ willReadFrequently: true }` for pixel operations
- Real-time preview updates are debounced (100ms) for smooth color picker interaction
- Original ImageData is cached to avoid recomputation
- Object URLs are properly cleaned up to prevent memory leaks

**State Management:**
- `ImageManager` maintains a Map of processed images with individual states
- Each image preserves its original data, processed data, and current fill color
- Color changes apply only to the current active image

### File Processing Requirements
- Supports PNG, GIF, WebP formats only
- File validation happens in `ImageManager.addImages()`
- Thumbnail generation uses scaled canvas for image list display
- Download preserves original format when possible, falls back to PNG

### UI State Coordination
The `UIController` manages complex state transitions:
- File upload → workspace visibility
- Image switching → canvas updates + thumbnail highlighting  
- Color changes → real-time preview updates
- Error states → user feedback messages