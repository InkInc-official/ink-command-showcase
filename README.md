# Ink Command Pro

Ink Inc. の内部ツールを一画面にまとめる、AI Ops HUD の試作です（FastAPI + React + Tauri）。

> **開発は終了しています（アーカイブ）。**
> 自宅サーバー構成に合わせた作りのため、そのままでは動きません。
> 設計の参考として公開しています。内部の接続先は仮の名前（`HOST_n_IP`）に置き換えています。

## 構成
- `backend/` — 各サーバーとサービスの状態を集める API
- `frontend/` — 状態を表示するウィジェット画面（Tauri でデスクトップアプリ化）

## ライセンス
MIT License
