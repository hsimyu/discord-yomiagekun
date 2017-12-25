const valid_speakers = ['hikari', 'haruka', 'show', 'takeru', 'santa', 'bear'];
class VoiceTextValidator {
    static isValidSpeaker(speaker) {
        return (valid_speakers.indexOf(speaker) > 0);
    }
}

module.exports = VoiceTextValidator;