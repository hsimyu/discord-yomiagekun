const {voice_text_api_token, discord_bot_token} = require('../src/tokens.js');

const voice_text_options = {
    "format": "wav",
    "speaker": "bear"
};

// voice-text setup
const { VoiceText } = require('voice-text');
const { writeFileSync } = require('fs');
const voiceText = new VoiceText(voice_text_api_token);

// discord setup
const Discord = require('discord.js');
const client = new Discord.Client();
client.login(discord_bot_token);

client.on('ready', () => {
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
            console.log("[push buffer[0] to voice stream]");
            const buffered_content = buffer.shift();
            getVoiceTextBuffer(buffered_content)
                .then(data => {
                writeFileSync("voice.wav", data);
                playMessageFromFile(connection, data);
            });
        } else {
            // 再度待つ
            console.log("[re invoke bufferToPlayStream]");
            setTimeout(bufferToPlayStream, wait_duration_ms);
        }
    }
}

function pushToBuffer(content) {
    buffer.push(content);
}