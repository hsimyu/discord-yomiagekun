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
            message.member.voiceChannel.join().catch(console.log);
        } else {
            message.reply('You need to join a voice channel first.');
        }
    }

    if (client.voiceConnections.array().length > 0) {
        const main_voice_connection = client.voiceConnections.array()[0];
        console.log("mainvoiceConnections = " + main_voice_connection);
        console.log("invoke play " + message.content);
        playMessageAsync(main_voice_connection, message.content);
    }
});

async function playMessageAsync(connection, content) {
    const stream = await voiceText.stream(content, { format: 'ogg' });
    connection.playStream(stream);
    console.log("played " + content);
}