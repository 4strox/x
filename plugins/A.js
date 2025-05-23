const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "songd",
    alias: ["playd", "music"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: "<query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube URL!");

        // Initial processing message
        const processingMsg = await reply("🔍 Searching for your song...");

        let videoUrl, title, thumbnail;  
        
        // URL check and search
        if (q.match(/(youtube\.com|youtu\.be)/)) {  
            videoUrl = q;  
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });  
            title = videoInfo.title;  
            thumbnail = videoInfo.thumbnail;  
        } else {  
            const search = await yts(q);  
            if (!search.videos.length) {
                await conn.sendMessage(from, { delete: processingMsg.key });
                return reply("❌ No results found!");  
            }
            videoUrl = search.videos[0].url;  
            title = search.videos[0].title;  
            thumbnail = search.videos[0].thumbnail;  
        }

        // Update status
        await conn.sendMessage(from, { 
            edit: processingMsg.key, 
            text: "⏳ Downloading audio..." 
        });

        // API list with timeout
        const apis = [
            { url: 'https://kaiz-apis.gleeze.com/api/ytmp3', key: 'f642c433-9f7d-4534-9437-abeffb42579f' },
            { url: 'https://kaiz-apis.gleeze.com/api/ytmp3', key: '70274fdf-52c5-4eaf-a95b-14da69559e96' },
            { url: 'https://kaiz-apis.gleeze.com/api/ytmp3', key: 'e74518f3-a81f-4b55-be54-4a52f736fa23' },
            { url: 'https://kaiz-apis.gleeze.com/api/ytmp3', key: '16ac0f6e-8b00-4195-ac10-ea742f262ec2' },
            { url: 'https://kaiz-apis.gleeze.com/api/ytmp3', key: 'a6b16fea-f3ba-41ab-98f2-e3660552537f' },
            { url: 'https://kaiz-apis.gleeze.com/api/ytmp3', key: 'adb523bb-74e0-4aa0-a0f2-31a41ab56cf1' }
        ];

        let data;
        let success = false;

        // Try APIs with timeout
        for (const api of apis) {
            try {
                const apiUrl = `${api.url}?url=${encodeURIComponent(videoUrl)}&apikey=${api.key}`;
                const source = axios.CancelToken.source();
                const timeout = setTimeout(() => {
                    source.cancel(`Timeout after 10 seconds`);
                }, 10000);

                const response = await axios.get(apiUrl, {
                    cancelToken: source.token,
                    timeout: 10000
                });

                clearTimeout(timeout);

                if (response.data?.download_url) {
                    data = response.data;
                    success = true;
                    break;
                }
            } catch (error) {
                console.log(`API ${api.key} failed:`, error.message);
                continue;
            }
        }

        if (!success) {
            await conn.sendMessage(from, { delete: processingMsg.key });
            return reply("❌ All download services failed. Please try again later.");
        }

        // Final status update
        await conn.sendMessage(from, { 
            edit: processingMsg.key, 
            text: "✅ Preparing to send your song..." 
        });

        // Send audio
        await conn.sendMessage(from, {  
            audio: { url: data.download_url },  
            mimetype: 'audio/mpeg',  
            fileName: `${title}.mp3`.replace(/[^\w\s.-]/g, ''),  
            contextInfo: {  
                externalAdReply: {  
                    title: title,  
                    body: `Downloaded By Subzero`,  
                    thumbnail: await axios.get(thumbnail, { responseType: 'arraybuffer' })
                        .then(res => res.data)  
                        .catch(() => null),  
                    mediaType: 2,  
                    mediaUrl: videoUrl  
                }  
            }  
        }, { quoted: mek });

        // Delete processing message
        await conn.sendMessage(from, { delete: processingMsg.key });

    } catch (error) {  
        console.error("Song download error:", error);  
        reply(`❌ Error: ${error.message}`);  
    }
});
