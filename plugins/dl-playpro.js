const { cmd } = require('../command');
const yts = require('yt-search');
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

        let videoUrl, title, thumbnail;
        
        // Check if it's a URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply("⏳ Processing your request...");

        // Use Kaiz API to get audio
        const apiUrl = `https://kaiz-apis.gleeze.com/api/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=f642c433-9f7d-4534-9437-abeffb42579f`;
        const { data } = await axios.get(apiUrl);

        if (!data.download_url) return reply("❌ Failed to get download link!");

        // Send the audio with metadata
        await conn.sendMessage(from, {
            audio: { url: data.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${data.title}.mp3`.replace(/[^\w\s.-]/g, ''),
            contextInfo: {
                externalAdReply: {
                    title: data.title,
                    body: `Downloaded By Subzero`,
                    thumbnail: await axios.get(data.thumbnail || thumbnail, { responseType: 'arraybuffer' })
                        .then(res => res.data)
                        .catch(() => null),
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Song download error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});


cmd({
    pattern: "video",
    alias: ["vid", "ytvideo"],
    react: "🎬",
    desc: "Download YouTube video",
    category: "download",
    use: "<query or url> [quality]",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a video name or YouTube URL!");

        // Extract quality if provided (default to 720)
        const [query, quality = "360"] = q.split("|").map(item => item.trim());
        
        let videoUrl, title, thumbnail;
        
        // Check if it's a URL
        if (query.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = query;
            const videoInfo = await yts({ videoId: query.split(/[=/]/).pop() });
            title = videoInfo.title;
            thumbnail = videoInfo.thumbnail;
        } else {
            // Search YouTube
            const search = await yts(query);
            if (!search.videos.length) return reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        await reply("⏳ Processing your video request...");

        // Use Kaiz API to get video
        const apiUrl = `https://kaiz-apis.gleeze.com/api/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${quality}`;
        const { data } = await axios.get(apiUrl);

        if (!data.download_url) return reply("❌ Failed to get video download link!");

        // Send the video with metadata
        await conn.sendMessage(from, {
            video: { url: data.download_url },
            mimetype: 'video/mp4',
            fileName: `${data.title}.mp4`.replace(/[^\w\s.-]/g, ''),
            caption: `*${data.title}*\nQuality: ${data.quality}p\n\n> DOWNLOADED BY SUBZERO`,
            thumbnail: await axios.get(data.thumbnail || thumbnail, { responseType: 'arraybuffer' })
                .then(res => res.data)
                .catch(() => null)
        }, { quoted: mek });

    } catch (error) {
        console.error("Video download error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});
