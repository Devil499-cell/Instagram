const axios = require('axios');

// ============================================
// DEVELOPER: @KINGITACHI18
// GitHub: https://github.com/KINGITACHI18
// ============================================

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Get video URL from query parameter
    const { url } = req.query;
    
    // Check if URL is provided
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'Please provide Instagram video URL',
            developer: '@KINGITACHI18',
            usage: 'GET /api/download?url=INSTAGRAM_VIDEO_URL'
        });
    }
    
    try {
        // Headers to mimic real browser
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        
        // Fetch Instagram page
        const response = await axios.get(url, { 
            headers,
            timeout: 10000
        });
        
        const html = response.data;
        let videoUrl = null;
        
        // Method 1: Search for video_url in HTML (Reels & Videos)
        let match = html.match(/"video_url":"([^"]+)"/);
        if (match && match[1]) {
            videoUrl = match[1].replace(/\\u0026/g, '&');
        }
        
        // Method 2: Search in video variants
        if (!videoUrl) {
            match = html.match(/"video_versions":\[{"url":"([^"]+)"/);
            if (match && match[1]) {
                videoUrl = match[1].replace(/\\u0026/g, '&');
            }
        }
        
        // Method 3: Search in display_url for video
        if (!videoUrl) {
            match = html.match(/"display_url":"([^"]+)"/);
            if (match && match[1] && match[1].includes('.mp4')) {
                videoUrl = match[1].replace(/\\u0026/g, '&');
            }
        }
        
        // Method 4: Search in GraphQL data
        if (!videoUrl) {
            const graphqlMatch = html.match(/<script type="text\/javascript">window\._sharedData = (.*?);<\/script>/);
            if (graphqlMatch && graphqlMatch[1]) {
                try {
                    const jsonData = JSON.parse(graphqlMatch[1]);
                    const media = jsonData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
                    if (media && media.video_url) {
                        videoUrl = media.video_url;
                    } else if (media && media.video_versions && media.video_versions[0]) {
                        videoUrl = media.video_versions[0].url;
                    }
                } catch(e) {
                    // Silent fail
                }
            }
        }
        
        // Return video URL if found
        if (videoUrl) {
            return res.json({
                success: true,
                developer: '@KINGITACHI18',
                download_link: videoUrl,
                message: 'Copy this link and paste in browser to download video',
                original_url: url
            });
        } else {
            return res.status(404).json({
                success: false,
                error: 'No video found in this post',
                developer: '@KINGITACHI18',
                message: 'Make sure URL contains a video (Reel, IGTV, or video post)'
            });
        }
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            developer: '@KINGITACHI18',
            message: 'Failed to fetch video. Check if URL is correct and post is public'
        });
    }
};
