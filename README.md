# discord-yomiagekun
DiscordのテキストをVoiceChatとして読み上げてくれるBot。
Node.jsで動きます。

VoiceText-APIとdiscord.jsを連携させて動いています。

- VoiceText: https://cloud.voicetext.jp/webapi
- discord.js: https://discord.js.org/#/
    - github: https://github.com/hydrabolt/discord.js

# Installation
### Install
```sh
git clone https://github.com/hsimyu/discord-yomiagekun.git
npm i
cp src/tokens.js.sample src/tokens.js
```

- (lib)sodium等のビルドに失敗する場合、gccを新しいものに更新するとビルドできる可能性があります。
- erlpack, uws, sodium, zlib-sync等のライブラリは読み上げを高速化するために使用しているものであり、必須ではありません。
インストール(ビルド)に失敗する場合はpackage.jsonの記述からこれらのライブラリについての記述を削除してください。

---

### VoiceTextのAPI取得
API利用登録はここから: https://cloud.voicetext.jp/webapi/api_keys/new

登録したメールアドレス宛にAPIキーが送られてきます。

---

### DiscordBotのトークンを取得
Discord - My Apps: https://discordapp.com/developers/applications/me

上記のページに飛んで
1. New App
2. APP NAMEを入力
3. Create App
4. Create Bot User
5. Bot欄の「Token: click to reveal」をクリックして、トークンを入手

---

### Configuration
src/tokens.jsにVoiceTextとDiscordBotのTokenをそれぞれ入力

---

# Run
```sh
npm run start
```
or
```sh
node src/index.js
```

# Commands
#### /join
コマンドを実行した人が参加しているVoiceチャンネルに接続します。

#### /leave
Voiceチャンネルを離脱します。

#### /change {key} {new_value}
VoiceText APIに渡すパラメータを変更できます。
- APIパラメータ例はこちらから: https://cloud.voicetext.jp/webapi/docs/api

現在はspeakerのみに対応しています。

例: speakerをsantaに変更
`/change speaker santa`

#### /exclude {channel_name}
テキスト読み上げを除外するチャンネルを設定します。
デフォルトではサーバー上の全てのチャンネルを読み上げます。

#### /include {channel_name}
テキスト読み上げ除外の設定を解除します。

# Configuration
起動時に`./config.json`の内容を読み込むようになっています。
以下の内容を設定可能です。

```json
{
    "speaker": "hikari",
    "pitch": 100,
    "speed": 100,
    "volume": 100,
    "emotion": "none",
    "emotion_level": 2,
    "exclude_channels": [
        "test1", "general", "yomiagenaiChannel"
    ]
}
```

また `'speaker', 'exclude_channels'` の値をコマンドで変更した場合は、
変更した内容が終了時に `config.json` に書き込まれます。

# Demo

# License
MIT