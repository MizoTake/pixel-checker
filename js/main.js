// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uiController = new UIController();
    uiController.init();
    
    // Log version and environment info
    console.log('透明ピクセル塗りつぶしツール v1.0.0');
    console.log('Canvas support:', !!document.createElement('canvas').getContext);
    console.log('File API support:', !!(window.File && window.FileReader && window.FileList));
});

// Add global error handler for better debugging
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = 'エラーが発生しました。ブラウザのコンソールを確認してください。';
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});