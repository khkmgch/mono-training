# mono-back

Quarkus(Java 21)による REST API バックエンドです。
セットアップ・起動・API 仕様はリポジトリルートの [README](../README.md) を参照してください。

Maven Wrapper を同梱しているため Maven のインストールは不要です。Windows では `.\mvnw.cmd`、macOS / Linux では `./mvnw` を使用します。

## 開発コマンド

| コマンド | 内容 |
|---|---|
| `./mvnw quarkus:dev` | 開発モードで起動(http://localhost:8080) |
| `./mvnw test` | テストを実行 |
