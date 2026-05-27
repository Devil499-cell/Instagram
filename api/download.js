const axios = require('axios');

// ============================================
// DEVELOPER: @KINGITACHI18
// Instagram Video Downloader - Advanced Bypass
// ============================================

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL is required',
            developer: '@KINGITACHI18'
        });
    }
    
    try {
        let videoUrl = null;
        
        // Try all methods
        videoUrl = await method1InstagramAPI(url);
        if (!videoUrl) videoUrl = await method2EmbedPage(url);
        if (!videoUrl) videoUrl = await method3MobileAgent(url);
        if (!videoUrl) videoUrl = await method4GraphQL(url);
        
        if (videoUrl) {
            return res.json({
                success: true,
                developer: '@KINGITACHI18',
                download_link: videoUrl,
                message: '✅ Copy link and paste in browser'
            });
        } else {
            return res.status(404).json({
                success: false,
                error: 'Video not found',
                developer: '@KINGITACHI18',
                message: 'Post might be private or Instagram blocked'
            });
        }
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            developer: '@KINGITACHI18'
        });
    }
};

async function method1InstagramAPI(url) {
    try {
        const shortcode = extractShortcode(url);
        if (!shortcode) return null;
        
        const apiUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=1`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Instagram 269.0.0.18.80 Android',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        return response.data?.graphql?.shortcode_media?.video_url || null;
    } catch(e) {
        return null;
    }
}

async function method2EmbedPage(url) {
    try {
        const embedUrl = url.replace('instagram.com', 'instagram.com/p/').split('?')[0] + '/embed/';
        
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const match = response.data.match(/<video[^>]+src="([^"]+\.mp4[^"]*)"/);
        return match ? match[1] : null;
    } catch(e) {
        return null;
    }
}

async function method3MobileAgent(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
            }
        });
        
        const html = response.data;
        const patterns = [
            /"video_url":"([^"]+)"/,
            /"video_versions":\[{"url":"([^"]+)"/,
            /<meta property="og:video" content="([^"]+)"/
        ];
        
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                return match[1].replace(/\\u0026/g, '&');
            }
        }
        return null;
    } catch(e) {
        return null;
    }
}

async function method4GraphQL(url) {
    try {
        const shortcode = extractShortcode(url);
        if (!shortcode) return null;
        
        const queryUrl = `https://www.instagram.com/graphql/query/?query_hash=2b5667c3a3c8747a5b3b9d7e5e5d9f8e&variables={"shortcode":"${shortcode}"}`;
        
        const response = await axios.get(queryUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        return response.data?.data?.shortcode_media?.video_url || null;
    } catch(e) {
        return null;
    }
}

function extractShortcode(url) {
    const patterns = [
        /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}
