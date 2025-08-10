#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Cross-platform build script
const isWindows = process.platform === 'win32';

function runCommand(command) {
    const { execSync } = require('child_process');
    
    try {
        console.log(`Running: ${command}`);
        execSync(command, { stdio: 'inherit', shell: true });
    } catch (error) {
        console.error(`Error running command: ${command}`);
        process.exit(1);
    }
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

console.log('Building pixel-checker...');

// Clean dist directory
console.log('Cleaning dist directory...');
if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
}

// Create dist directory
ensureDir('dist');

// Copy files
console.log('Copying files...');
copyFile('index.html', 'dist/index.html');
copyFile('styles.css', 'dist/styles.css');
copyDirectory('js', 'dist/js');

// Copy test.html and README.md if they exist
if (fs.existsSync('test.html')) {
    copyFile('test.html', 'dist/test.html');
}
if (fs.existsSync('README.md')) {
    copyFile('README.md', 'dist/README.md');
}

console.log('Build completed successfully!');
console.log('Files are in the "dist" directory');

// Optional: Create zip file
if (process.argv.includes('--zip')) {
    console.log('Creating zip file...');
    const archiver = require('archiver');
    const output = fs.createWriteStream('pixel-checker-dist.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
        console.log(`Created pixel-checker-dist.zip (${archive.pointer()} bytes)`);
    });
    
    archive.on('error', (err) => {
        throw err;
    });
    
    archive.pipe(output);
    archive.directory('dist/', false);
    archive.finalize();
}