# 透明ピクセル塗りつぶしツール

画像の透明部分を検知して、指定した色で塗りつぶすWebアプリケーションです。

## 機能

- **複数画像対応**: PNG、GIF、WebP形式の複数画像を同時にアップロード可能
- **リアルタイムプレビュー**: 色を変更すると即座にプレビューが更新
- **ドラッグ&ドロップ**: ファイルをドラッグ&ドロップでアップロード可能
- **透明度検出**: 完全透明・半透明ピクセルを自動検出
- **高パフォーマンス**: Canvas APIを使用したクライアントサイド処理

## 使い方

1. `index.html` をブラウザで開く
2. 画像をアップロード（クリックまたはドラッグ&ドロップ）
3. 塗りつぶし色を選択
4. プレビューを確認してダウンロード

## テスト

`test.html` を開くと、透明度を含むテスト画像を生成できます。

## 技術仕様

- **言語**: Vanilla JavaScript (フレームワーク不使用)
- **API**: HTML5 Canvas API, File API
- **対応形式**: PNG, GIF, WebP
- **ブラウザ**: モダンブラウザ（Chrome, Firefox, Safari, Edge）

## ファイル構成

```
pixel-checker/
├── index.html          # メインアプリケーション
├── styles.css          # スタイルシート
├── test.html           # テストページ
├── js/
│   ├── main.js         # エントリーポイント
│   ├── CanvasRenderer.js    # Canvas描画管理
│   ├── ImageManager.js      # 画像管理
│   ├── TransparencyDetector.js  # 透明度検出
│   ├── PixelProcessor.js    # ピクセル処理
│   └── UIController.js      # UI制御
└── README.md
```

## パフォーマンス最適化

- Canvas APIの `willReadFrequently` オプションで読み取り性能を最適化
- リアルタイムプレビューのデバウンス処理
- 画像データのキャッシュによる再計算の回避
- レスポンシブデザインで様々な画面サイズに対応