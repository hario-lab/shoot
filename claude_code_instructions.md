# ATT&CK Scenario Engine 改善指示書

以下の改善をすべて実装してください。

---

## 1. リスクスコアの計算バグ修正（IMPACT ANALYSIS）

リスクスコアの計算にバグがある。

**現在（誤り）:**
```
テクニック数 × 戦術カバレッジ(%)
例: 30 × 93 = 2790
```

**正しい計算:**
```
テクニック数 × 戦術カバレッジ(小数)
例: 30 × 0.93 = 27.9
```

戦術カバレッジを100で割ってから掛け合わせるように修正すること。

---

## 2. DEFENSE GAP MAP：タクティクス単位の一括切り替え

現在はテクニックを1つずつクリックして「未対応／一部／対応済み」を
設定しなければならず、操作が大変。

以下を追加すること：

- タクティクスのヘッダー横に「未対応」「一部」「対応済み」の
  3つのボタンを設置する
- クリックするとそのタクティクスに属する
  テクニックが全て一括で切り替わる
- その後、個別テクニックで個別調整できる既存の動作はそのまま維持する

**操作フローのイメージ:**
```
① タクティクスレベルで大まかに設定
   [INITIAL ACCESS] → 全部「未対応」にする
   [EXECUTION]      → 全部「一部」にする

② 個別テクニックで微調整
   T1566 Phishing   → 対応済みに変更
   T1059 PowerShell → 未対応のまま
```

---

## 3. AI BRIEFING：APIキー設定機能

APIキーを.envファイルで直接編集するのではなく、
アプリ内の設定画面から入力できるようにする。

以下を実装すること：

- 画面右上に「⚙ 設定」ボタンを設置する
- クリックするとモーダルが開き、以下を設定できる：
  - Anthropic APIキーの入力欄（パスワード形式で非表示）
  - 「保存」ボタン（localStorageに保存）
  - 「テスト接続」ボタン（簡単なAPIコールで疎通確認）
  - 接続状態の表示（✅ 接続済み / ❌ 未設定）
- APIキーが未設定の場合：
  - AI BRIEFINGタブに「APIキーが未設定です。右上の⚙設定から
    入力してください」とわかりやすく表示する
  - https://console.anthropic.com へのリンクも表示する
- APIキーが設定済みの場合：
  - そのままAI BRIEFINGが使える状態にする

---

## 4. KILL CHAIN：サイドパネルへの変更

現在はテクニックの詳細説明とGENERATE SCENARIOが
画面下部に表示されており、スクロールしないと見えない。
画面右側の常設サイドパネルに変更する。

**変更後のレイアウト:**
```
┌─────────────────────────┬────────────────────┐
│                         │  【サイドパネル】    │
│   KILL CHAIN            │                    │
│   （横スクロール）       │ T1059              │
│                         │ PowerShell         │
│ RECON  INIT ACC  EXEC   │ ────────────────── │
│ [T1591] [T1566] [T1059] │ 説明テキスト...     │
│                         │                    │
│                         │ プラットフォーム    │
│                         │ Windows Linux      │
│                         │                    │
│                         │ ────────────────── │
│                         │ ▶ GENERATE         │
│                         │   SCENARIO         │
│                         │                    │
│                         │ 生成されたシナリオ   │
│                         │ がここに表示...      │
└─────────────────────────┴────────────────────┘
```

以下を実装すること：

- 画面右側にサイドパネルを常設する（幅は画面の30%程度）
- テクニックをクリックすると右パネルに詳細が表示される
- サブテクニックの詳細も右パネルに表示される
- GENERATE SCENARIOボタンを右パネルに配置する
- 生成されたシナリオも右パネル内にスクロール表示する
- KILLCHAINの横スクロールはサイドパネルに影響しない
- ✕ボタンでパネルを閉じられる
- パネルが閉じている時はKILL CHAINが全幅で表示される

---

## 5. NETWORK GRAPH：ラベルの修正

「共有TTP数」というラベルを「共有テクニック数」に修正する。
（TTPという用語はテクニック単体を指す言葉ではないため）

---

## 6. クレジット表記の追加

MITREの利用規約に従い、アプリ内に以下のクレジットを表示する。

### フッター（画面最下部に常時表示）

全タブ共通で画面最下部に常時表示する。
文字は小さめ（fontSize: 10px程度）・控えめなデザインにすること。

表示内容：
```
Powered by MITRE ATT&CK®  |
© 2025 The MITRE Corporation. This work is reproduced and
distributed with the permission of The MITRE Corporation.
| ATT&CK Terms of Use
```

「ATT&CK Terms of Use」はリンクにして以下のURLに飛ぶようにする：
https://attack.mitre.org/resources/legal-and-branding/terms-of-use/

### Aboutモーダル（ヘッダー右上）

ヘッダー右上に「ⓘ About」ボタンを設置する。
クリックするとモーダルが開いて以下を表示する：

```
ATT&CK Scenario Engine

本ツールはMITRE ATT&CK®データを使用しています。

© 2025 The MITRE Corporation.
This work is reproduced and distributed
with the permission of The MITRE Corporation.

ATT&CK®        https://attack.mitre.org
Terms of Use   https://attack.mitre.org/resources/legal-and-branding/terms-of-use/
Data Source    https://github.com/mitre/cti
```

各URLはクリッカブルなリンクにすること。

---

以上6点をすべて実装し、動作確認してください。
