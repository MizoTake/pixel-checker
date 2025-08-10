#!/bin/bash

# 透明ピクセル塗りつぶしツール - ローカルサーバー起動スクリプト

echo "=========================================="
echo "透明ピクセル塗りつぶしツール"
echo "ローカルサーバー起動スクリプト"
echo "=========================================="

# ポート番号の設定
PORT=8080
ALT_PORT=3000

# 利用可能なサーバーをチェック
check_command() {
    command -v "$1" >/dev/null 2>&1
}

# ポートが使用中かチェック
check_port() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$1 >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -an | grep ":$1 " >/dev/null 2>&1
    else
        return 1
    fi
}

# サーバー起動関数
start_server() {
    local cmd="$1"
    local port="$2"
    
    echo "サーバーを起動しています..."
    echo "URL: http://localhost:$port"
    echo "終了するには Ctrl+C を押してください"
    echo ""
    
    # ブラウザを自動で開く（macOS/Linux対応）
    sleep 2 && {
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            open http://localhost:$port 2>/dev/null
        elif command -v xdg-open >/dev/null 2>&1; then
            # Linux
            xdg-open http://localhost:$port 2>/dev/null
        fi
    } &
    
    eval "$cmd"
}

# メイン処理
echo "利用可能なサーバーをチェックしています..."

# ポートの確認
if check_port $PORT; then
    echo "ポート $PORT は使用中です。代替ポート $ALT_PORT を使用します。"
    PORT=$ALT_PORT
fi

if check_port $PORT; then
    echo "ポート $PORT も使用中です。別のポート番号を指定してください。"
    read -p "使用するポート番号を入力してください (例: 8081): " PORT
    
    if [[ ! "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
        echo "エラー: 有効なポート番号を入力してください (1024-65535)"
        exit 1
    fi
fi

echo ""

# Node.js + npm scriptsの場合（優先）
if check_command npm && [ -f "package.json" ]; then
    echo "✓ npm が見つかりました (package.json経由)"
    # npm run serveを試す
    if npm run serve --silent 2>/dev/null; then
        echo "npm run serveでサーバーを起動します"
        
        # ブラウザを開く
        sleep 2 && {
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open http://localhost:$PORT 2>/dev/null
            elif command -v xdg-open >/dev/null 2>&1; then
                xdg-open http://localhost:$PORT 2>/dev/null
            fi
        } &
        
        npm run serve
        exit 0
    fi
fi

# Python 3の場合
if check_command python3; then
    echo "✓ Python 3 が見つかりました"
    start_server "python3 -m http.server $PORT" $PORT

# Python 2の場合
elif check_command python; then
    echo "✓ Python が見つかりました"
    start_server "python -m SimpleHTTPServer $PORT" $PORT

# Node.js + http-serverの場合
elif check_command http-server; then
    echo "✓ http-server (Node.js) が見つかりました"
    start_server "http-server -p $PORT -o" $PORT

# Node.js + live-serverの場合
elif check_command live-server; then
    echo "✓ live-server (Node.js) が見つかりました"
    start_server "live-server --port=$PORT" $PORT

# PHPの場合
elif check_command php; then
    echo "✓ PHP が見つかりました"
    start_server "php -S localhost:$PORT" $PORT

# Ruby + WEBrickの場合
elif check_command ruby; then
    echo "✓ Ruby が見つかりました"
    start_server "ruby -run -e httpd . -p $PORT" $PORT

# 手動起動の指示
else
    echo ""
    echo "❌ 利用可能なWebサーバーが見つかりませんでした"
    echo ""
    echo "以下のいずれかをインストールしてください："
    echo ""
    echo "【推奨】Node.js + npm:"
    echo "  - npm install"
    echo "  - npm run serve"
    echo ""
    echo "Python:"
    echo "  - Python 3: python3 -m http.server $PORT"
    echo "  - Python 2: python -m SimpleHTTPServer $PORT"
    echo ""
    echo "その他:"
    echo "  - PHP: php -S localhost:$PORT"
    echo "  - Ruby: ruby -run -e httpd . -p $PORT"
    echo ""
    echo "または、ブラウザで index.html を直接開いてください"
    echo "（ただし、一部機能が制限される場合があります）"
    echo ""
    exit 1
fi