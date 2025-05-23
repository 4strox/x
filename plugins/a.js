const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "song",
    alias: ["play", "music"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: "<query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube URL!");

        await reply("🔍 Searching for your song...");

        // Use the provided API
        const apiUrl = `https://kaiz-apis.gleeze.com/api/ytdown-mp3?url=${encodeURIComponent(q)}&apikey=adb523bb-74e0-4aa0-a0f2-31a41ab56cf1`;
        const { data } = await axios.get(apiUrl);

        if (!data.download_url) return reply("❌ Failed to get download link!");

        await reply("🎧 Sending your song...");

        // Send the audio file
        await conn.sendMessage(from, {  
            audio: { url: data.download_url },  
            mimetype: 'audio/mpeg',
            fileName: data.title.replace(/[^\w\s.-]/g, '') + '.mp3',
            contextInfo: {  
                externalAdReply: {  
                    title: data.title,
                    body: "Downloaded via Kaiz API",
                    thumbnail: await axios.get(data.thumbnail || '', { responseType: 'arraybuffer' })
                        .then(res => res.data)
                        .catch(() => null),
                    mediaType: 2,
                    mediaUrl: q
                }  
            }  
        }, { quoted: mek });

    } catch (error) {  
        console.error("Error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});
