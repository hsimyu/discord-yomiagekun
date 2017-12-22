const {voice_text_api_token, discord_bot_token} = require('../src/tokens.js');

// voice-text setup
const { VoiceText } = require('voice-text');
const { writeFileSync } = require('fs');
const voiceText = new VoiceText(voice_text_api_token);

// discord setup
const Discord = require('discord.js');
const client = new Discord.Client();
client.login(discord_bot_token);

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content === '/join') {
        if (message.member.voiceChannel) {
            message.member.voiceChannel.join()
                .then(connection => { // connectionはVoice Connectionのインスタンス
                    message.reply('I have successfully connected to the channel!');
                })
                .catch(console.log);
        } else {
            message.reply('You need to join a voice channel first.');
        }
    }

    console.log("broadcasts = " + client.broadcasts);
    console.log("voiceConnections = " + client.voiceConnections.values());
    if (client.voiceConnections.array().length > 0) {
        console.log("play " + message.content);
        const stream = voiceText.stream(message.content, { format: 'ogg' });
        for (const connection of client.voiceConnections.values()) {
            connection.playStream(stream);
        }
        console.log("played.");
    }
});
