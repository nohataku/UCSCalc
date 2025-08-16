# レジ下金庫計算アプリ

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_SITE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_SITE_NAME/deploys)

レジ下金庫に保管されている現金の合計金額を計算するWebアプリケーションです。

## 🌐 ライブデモ

[https://ucscalc.netlify.app/](https://ucscalc.netlify.app/)

## 機能

### 💰 現金計算
- **紙幣**: 一万円札、五千円札、二千円札、千円札
- **硬貨（バラ）**: 五百円玉、百円玉、五十円玉、十円玉、五円玉、一円玉
- **棒金**: 各硬貨の棒金（50枚単位）

### 📊 差額分析
- 想定金額との差額を自動計算
- 差額の原因となる可能性のあるパターンを表示
- 過多・不足の判定

### 🎯 主な特徴
- **リアルタイム計算**: 入力と同時に金額が自動更新
- **レスポンシブデザイン**: スマートフォンからPCまで対応
- **直感的なUI**: 分かりやすいレイアウトと色分け
- **キーボードショートカット**: Ctrl+Delete（クリア）

## 使い方

1. **現金の数量入力**
   - 各セクション（紙幣、硬貨、棒金）に保有している数量を入力
   - 入力と同時に合計金額が自動更新

2. **想定金額の設定**
   - レジの理論在高や期待値を入力
   - 入力すると自動的に差額分析が実行

3. **結果の確認**
   - 合計金額が大きく表示
   - 差額がある場合は原因の候補が自動表示

## 棒金について

| 硬貨 | 1本あたりの枚数 | 1本あたりの金額 |
|------|-----------------|-----------------|
| 五百円 | 50枚 | 25,000円 |
| 百円 | 50枚 | 5,000円 |
| 五十円 | 50枚 | 2,500円 |
| 十円 | 50枚 | 500円 |
| 五円 | 50枚 | 250円 |
| 一円 | 50枚 | 50円 |

## 技術仕様

- **HTML5**: セマンティックなマークアップ
- **CSS3**: レスポンシブデザイン、アニメーション
- **JavaScript**: バニラJS、リアルタイム計算
- **PWA対応**: オフライン利用、ホーム画面追加
- **Netlify**: 静的サイトホスティング、CDN配信

## デプロイ

### Netlify（推奨）

1. **GitHubリポジトリの接続**
   ```bash
   # GitHubにプッシュ
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Netlifyでのデプロイ設定**
   - [Netlify](https://netlify.com) にログイン
   - "New site from Git" を選択
   - GitHubリポジトリを選択
   - ビルド設定は自動検出（netlify.toml使用）
   - Deploy site をクリック

3. **カスタムドメイン設定（オプション）**
   - Site settings > Domain management
   - Custom domain を追加

### 手動デプロイ
```bash
# ファイルをZIPでアップロード
zip -r ucscalc.zip . -x "*.git*" "README.md"
```

## ブラウザ対応

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## インストール・セットアップ

このアプリはNetlifyでホストされており、ブラウザから直接アクセスできます。

**ライブサイト**: [https://ucscalc.netlify.app/](https://ucscalc.netlify.app/)

ローカルで実行する場合：

```bash
# リポジトリをクローン
git clone https://github.com/nohataku/UCSCalc.git

# ディレクトリに移動
cd UCSCalc

# ローカルサーバーで実行（例：Python）
python -m http.server 8000
```

ブラウザで `http://localhost:8000` にアクセスしてください。

## ライセンス

MIT License

## 貢献

バグ報告や機能提案は Issues でお願いします。プルリクエストも歓迎します。

## 更新履歴

### v1.0.0
- 初回リリース
- 基本的な現金計算機能
- 差額分析機能
- レスポンシブデザイン対応
