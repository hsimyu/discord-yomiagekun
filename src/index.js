const {voice_text_api_token, discord_bot_token} = require('../src/tokens.js');

// voice-text setup
const { VoiceText } = require('voice-text');
const { writeFileSync } = require('fs');
const voiceText = new VoiceText(voice_text_api_token);

// discord setup
const Discord = require('discord.js');
const client = new Discord.Client();
client.login(discord_bot_token);

// file system
const fs = require('fs');
function fileExists(path) {
    try {
        fs.statSync(path);
        return true;
    } catch (err) {
        if (err.code == 'ENOENT') return false;

        console.error("Unhandle Error: ", err.message);
        return false;
    }
}

const config_path = "./config.json";
let voice_text_options = {
    'format': 'wav',
    'speaker': 'hikari'
};

client.on('ready', () => {
    if (fileExists(config_path)) {
        let config = JSON.parse(fs.readFileSync(config_path, 'utf8'));

        // default 設定を上書き
        voice_text_options.speaker = config.speaker;

        let keylist = ['pitch', 'speed', 'volume'];
        keylist.forEach((key) => {
            if (key in config) {
                voice_text_options[key] = config[key];
            }
        });

        if ('emotion' in config && config.emotion != 'none') {
            voice_text_options.emotion = config.emotion;

            if ('emotion_level' in config) voice_text_options.emotion_level = config.emotion_level;
        }
    }
    console.log('[Ready!]');
});

// 端末上での終了処理
process.on('SIGINT', () => {
    if (connection) {
        connection.disconnect();
        console.log('[Disconnect from voice channel]');
    }
    console.log('[Destroy client]');
    client.destroy();

    delete voice_text_options["format"];
    let json_config = JSON.stringify(voice_text_options, null, '    ');
    fs.writeFileSync(config_path, json_config);
    console.log('[Save config]');
    process.exit(0);
})

let connection = null;
let buffer = [];

const wait_duration_ms = 500;

client.on('message', message => {
    if (connection && message.content !== '') {
        playVoice(message.content);
    }

    if (message.content === '/join') {
        if (message.member.voiceChannel) {
            message.member.voiceChannel.join()
                .then(new_connection => {
                    connection = new_connection;
                }).catch(console.log);
        } else {
            message.reply('/joinコマンドはVoiceチャンネルに参加していないと使用できません.');
        }
    }
});

function playVoice(content) {
    if (!(connection.speaking)) {
        getVoiceTextBuffer(content)
            .then(data => {
            writeFileSync("voice.wav", data);
            playMessageFromFile(connection, data);
        });
    } else {
        pushToBuffer(content);
        setTimeout(bufferToPlayStream, wait_duration_ms);
    }
}

async function getVoiceTextBuffer(content) {
    const fetched_buffer = await voiceText.fetchBuffer(content, voice_text_options);
    return fetched_buffer;
}

function playMessageFromFile(connection, stream) {
    const dispatcher = connection.playFile("voice.wav");
}

function bufferToPlayStream() {
    if (buffer.length > 0) {
        if (!(connection.speaking)) {
            const buffered_content = buffer.shift();
            getVoiceTextBuffer(buffered_content)
                .then(data => {
                writeFileSync("voice.wav", data);
                playMessageFromFile(connection, data);
            });
        } else {
            // 再度待つ
            setTimeout(bufferToPlayStream, wait_duration_ms);
        }
    }
}

function pushToBuffer(content) {
    buffer.push(content);
}