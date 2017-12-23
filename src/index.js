const {voice_text_api_token, discord_bot_token} = require('../src/tokens.js');

// voice-text setup
const { VoiceText } = require('voice-text');
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
const wait_duration_ms = 1000;

client.on('message', message => {
    console.log("content = " + message.content);
    if (connection && message.content !== '') {
        pushToVoiceStream(message.content);
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

async function pushToVoiceStream(content) {
    console.log("[push to voice stream]");
    const stream = await getVoiceTextStream(content);
    console.log("[check voice connection status]");

    if (!connection.playing) {
        console.log("[play message]");
        playMessage(connection, stream);
    } else {
        console.log("[push to buffer]");
        pushToBuffer(stream);
        setTimeout(bufferToPlayStream, wait_duration_ms);
    }
}

async function getVoiceTextStream(content) {
    const stream = await voiceText.stream(content, { format: 'wav' });
    return stream;
}

async function playMessage(connection, stream) {
    connection.playStream(stream);
}

function bufferToPlayStream() {
    console.log("[buffer to play stream]");
    if (buffer.length > 0) {
        if (!connection.playing) {
            console.log("[play buffer]");
            const buffered_stream = buffer.shift();
            playMessage(connection, buffered_stream);
        } else {
            // 再度待つ
            console.log("[re invoke bufferToPlayStream]");
            setTimeout(bufferToPlayStream, wait_duration_ms);
        }
    }
}

function pushToBuffer(stream) {
    buffer.push(stream);
}