const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

cmd(
    {
        pattern: 'song',
        alias: ['ytmp3', 'music', 'mp3'],
        desc: 'Download songs from YouTube',
        category: 'media',
        use: '<song name or YouTube URL>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        try {
            if (!q) return reply('🎵 *Please provide a song name or YouTube URL*\nExample: .song Alan Walker Lily\nOr: .song https://youtu.be/ox4tmEV6-QU');

            // Send processing reaction
            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            let videoUrl = q;
            
            // If it's not a URL, search YouTube
            if (!q.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)) {
                reply('🔍 Searching YouTube...');
                const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
                const searchResponse = await axios.get(searchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                // Extract first video ID
                const videoIdMatch = searchResponse.data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
                if (!videoIdMatch) return reply('❌ No results found for your search');
                
                videoUrl = `https://youtube.com/watch?v=${videoIdMatch[1]}`;
                reply(`🎬 Found: ${videoUrl}`);
            }

            // Call Kaiz API
            reply('⬇️ Downloading audio...');
            const apiUrl = `https://kaiz-apis.gleeze.com/api/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=f642c433-9f7d-4534-9437-abeffb42579f`;
            const response = await axios.get(apiUrl);
            
            if (!response.data || !response.data.download_url) {
                return reply('❌ Failed to get download link. The video may be restricted.');
            }

            const songInfo = response.data;
            
            // Download the audio file
            const audioResponse = await axios.get(songInfo.download_url, {
                responseType: 'arraybuffer',
                timeout: 60000 // 1 minute timeout
            });
            
            const audioBuffer = Buffer.from(audioResponse.data, 'binary');
            
            // Get thumbnail
            let thumbnailBuffer;
            try {
                const thumbResponse = await axios.get(songInfo.thumbnail, {
                    responseType: 'arraybuffer'
                });
                thumbnailBuffer = Buffer.from(thumbResponse.data, 'binary');
            } catch (e) {
                thumbnailBuffer = null;
            }

            // Send the audio file
            await conn.sendMessage(mek.chat, { 
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${songInfo.title}.mp3`.replace(/[^\w\s.-]/gi, ''),
                contextInfo: {
                    externalAdReply: {
                        title: songInfo.title,
                        body: `🎵 By ${songInfo.author || 'Unknown Artist'}`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 2,
                        mediaUrl: videoUrl,
                        sourceUrl: videoUrl
                    }
                }
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('Song download error:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            
            let errorMsg = '❌ Error downloading song. ';
            if (error.response?.status === 429) {
                errorMsg += 'API limit reached. Try again later.';
            } else if (error.code === 'ECONNABORTED') {
                errorMsg += 'Download timed out. Try a shorter song.';
            } else {
                errorMsg += 'Please try again.';
            }
            
            reply(errorMsg);
        }
    }
);

/*const { cmd } = require('../command');
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
        const apiUrl = `https://kaiz-apis.gleeze.com/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;
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
*/
