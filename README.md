# Active Recall

間隔反復学習を活用したフラッシュカードアプリケーション。SM-2アルゴリズムに基づいた最適な復習スケジューリングで、効率的な記憶定着をサポートします。

## 主な機能

- **スマートな間隔反復**: SM-2アルゴリズムの改良版を使用し、3段階評価（忘れた・難しい・良い）で最適な復習タイミングを自動計算
- **多様なカードタイプ**: テキスト、コードスニペット、画像、多肢選択式に対応
- **学習統計**: 学習進捗、習熟度分布、評価履歴をグラフで可視化
- **デッキ管理**: カテゴリ別にフラッシュカードを整理
- **ローカルストレージ**: すべてのデータをブラウザに保存（サーバー不要）
- **ライト/ダークテーマ**: お好みのテーマで学習可能

## Getting Started

### 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

### ビルド

```bash
# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

### その他のコマンド

```bash
# ESLintでコードチェック
npm run lint
```

## 技術スタック

- **フロントエンド**: React 19, TypeScript
- **ビルドツール**: Vite
- **ルーティング**: React Router v7
- **スタイリング**: CSS（カスタムプロパティによるテーマ対応）
- **UI**: lucide-react（アイコン）、recharts（グラフ）
- **状態管理**: React Context + useReducer

## プロジェクト構造

```text
src/
├── pages/          # ページコンポーネント（Decks, DeckDetail, Study, Stats）
├── store/          # React Context による状態管理
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
│   ├── spaced-repetition.ts  # SM-2アルゴリズム実装
│   ├── storage.ts            # localStorage操作
│   └── seed.ts               # 初期データ生成
└── App.tsx         # メインアプリケーション
```

## ライセンス

This project is private and not licensed for public use.
