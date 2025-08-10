@echo off
chcp 65001 > nul

echo ==========================================
echo 透明ピクセル塗りつぶしツール
echo ローカルサーバー起動スクリプト (Windows)
echo ==========================================

set PORT=8080
set ALT_PORT=3000

echo 利用可能なサーバーをチェックしています...

:: npm + package.jsonのチェック（優先）
if exist "package.json" (
    npm --version >nul 2>&1
    if %errorlevel% == 0 (
        echo ✓ npm が見つかりました (package.json経由)
        echo npm run serveでサーバーを起動します
        echo URL: http://localhost:%PORT%
        echo 終了するには Ctrl+C を押してください
        echo.
        
        :: ブラウザを開く
        timeout /t 2 /nobreak >nul
        start http://localhost:%PORT%
        
        :: サーバー起動
        npm run serve
        goto :end
    )
)

:: Python 3のチェック
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Python が見つかりました
    echo サーバーを起動しています...
    echo URL: http://localhost:%PORT%
    echo 終了するには Ctrl+C を押してください
    echo.
    
    :: ブラウザを開く
    timeout /t 2 /nobreak >nul
    start http://localhost:%PORT%
    
    :: サーバー起動
    python -m http.server %PORT%
    goto :end
)

:: Node.js + http-serverのチェック
http-server --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ http-server (Node.js) が見つかりました
    echo サーバーを起動しています...
    echo URL: http://localhost:%PORT%
    echo 終了するには Ctrl+C を押してください
    echo.
    
    :: ブラウザを開く
    timeout /t 2 /nobreak >nul
    start http://localhost:%PORT%
    
    :: サーバー起動
    http-server -p %PORT% -o
    goto :end
)

:: PHPのチェック
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ PHP が見つかりました
    echo サーバーを起動しています...
    echo URL: http://localhost:%PORT%
    echo 終了するには Ctrl+C を押してください
    echo.
    
    :: ブラウザを開く
    timeout /t 2 /nobreak >nul
    start http://localhost:%PORT%
    
    :: サーバー起動
    php -S localhost:%PORT%
    goto :end
)

:: サーバーが見つからない場合
echo.
echo ❌ 利用可能なWebサーバーが見つかりませんでした
echo.
echo 以下のいずれかをインストールしてください：
echo.
echo 【推奨】Node.js + npm:
echo   - https://nodejs.org/ からダウンロード
echo   - npm install
echo   - npm run serve
echo.
echo Python:
echo   - https://www.python.org/ からダウンロード
echo   - インストール後: python -m http.server %PORT%
echo.
echo その他:
echo   - PHP: https://www.php.net/downloads.php
echo.
echo または、ブラウザで index.html を直接開いてください
echo （ただし、一部機能が制限される場合があります）
echo.

:end
pause