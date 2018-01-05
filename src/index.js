const {voice_text_api_token, discord_bot_token} = require('../src/tokens.js');

// voice-text setup
const { VoiceText } = require('voice-text');
const { writeFileSync } = require('fs');
const voiceTextValidator = require('../src/vt_validator.js');
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
let config = {};
let voice_text_options = {
    'format': 'wav',
    'speaker': 'hikari'
};

client.on('ready', () => {
    if (fileExists(config_path)) {
        config = JSON.parse(fs.readFileSync(config_path, 'utf8'));

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

    // 変更されている可能性のあるkeyのみconfigに上書きする
    config.speaker = voice_text_options.speaker;

    let json_config = JSON.stringify(config, null, '    ');
    fs.writeFileSync(config_path, json_config);
    console.log('[Save config.]');
    process.exit(0);
})

let connection = null;
let buffer = [];

// 実際のクライアントの動作
client.on('message', message => {
    const regexp_command = /^\/(.*)/i;
    const regexp_mention = /^@(.*)/i;

    if (message.content.match(regexp_command)) {
        let command = message.content.split(' ');

        if (command[0] === '/join') {
            if (message.member.voiceChannel) {
                message.member.voiceChannel.join()
                    .then(new_connection => {
                        connection = new_connection;
                    }).catch(console.log);
            } else {
                message.reply('/joinコマンドはVoiceチャンネルに参加していないと使用できません.');
            }
        } else if (command[0] === '/change') {
            if (command.length > 2) {
                switch(command[1]) {
                    case 'speaker':
                        voice_text_options.speaker = (voiceTextValidator.isValidSpeaker(command[2])) ? command[2] : 'hikari';
                        break;
                }
            } else {
                message.reply('/change {変更するキー} {変更後の値} の形式で使用してください.');
            }
        } else if (command[0] === '/leave') {
            if (connection != null) {
                connection.disconnect();
                connection = null;
            }
        } else if (command[0] === '/exclude') {
            if (command.length == 2) {
                if (!('exclude_channels' in config)) {
                    config['exclude_channels'] = [];
                }

                config.exclude_channels.push(command[1]);
                message.reply(command[1] + 'チャンネルを読み上げ除外に設定しました。(除外対象: ' + config.exclude_channels.join(',') + ')');
            } else {
                message.reply('/exclude {読み上げを除外するチャンネル} の形式で使用してください.');
            }
        }
    } else if (message.content.match(regexp_mention)) {
        console.log('It is mention: ' + message.content);
    } else {
        if (connection && message.content !== '' && !shouldExcludeTextChannel(config, message.channel)) {
            playVoice(message.content);
        }
    }
});

function shouldExcludeTextChannel(config, text_channel) {
    if ('exclude_channels' in config) {
        if (config['exclude_channels'].indexOf(text_channel) > 0) return true;
    }
    return false;
}

const wait_duration_ms = 500;
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
