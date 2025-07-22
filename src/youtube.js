/**
 * YouTube RSS feed fetching and parsing
 * Uses native fetch API with AbortController for timeout handling
 */

import FeedParser from '@rowanmanning/feed-parser';
import { getLogger } from './logger.js';

const logger = getLogger();

// YouTube RSS feed URLs
const YOUTUBE_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml';

/**
 * Generate RSS feed URL for a channel
 */
function getChannelFeedUrl(channelId) {
  return `${YOUTUBE_RSS_BASE}?channel_id=${channelId}`;
}

/**
 * Generate RSS feed URL for a playlist
 */
function getPlaylistFeedUrl(playlistId) {
  return `${YOUTUBE_RSS_BASE}?playlist_id=${playlistId}`;
}

/**
 * Fetch RSS feed with timeout and error handling
 */
async function fetchFeedXML(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EchoTube/1.0.0 (RSS Feed Monitor)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    logger.debug(`RSS feed response length: ${xmlText.length} characters`);
    logger.debug(`RSS feed preview: ${xmlText.substring(0, 500)}...`);
    return xmlText;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    
    throw error;
  }
}

/**
 * Parse RSS feed XML into structured video data
 */
async function parseRSSFeed(xmlText) {
  try {
    const feed = await FeedParser.parseFeed(xmlText);
    
    if (!feed || !feed.items) {
      throw new Error('Invalid RSS feed format');
    }

    // Extract video information from feed items
    logger.debug(`Feed has ${feed.items.length} items`, { feedTitle: feed.title });
    
    const videos = feed.items.map((item, index) => {
      // Debug the raw item structure
      logger.debug(`Raw feed item ${index + 1} keys:`, { keys: Object.keys(item) });
      
      // Extract video ID from the id field (format: "yt:video:VIDEO_ID")
      let videoId = null;
      if (item.id && item.id.startsWith('yt:video:')) {
        videoId = item.id.replace('yt:video:', '');
      }
      
      // Fallback to extracting from URL
      if (!videoId && item.url) {
        videoId = extractVideoIdFromLink(item.url);
      }
      
      // Get channel name from authors array
      let channelName = feed.title || 'Unknown Channel';
      if (item.authors && item.authors.length > 0) {
        channelName = item.authors[0].name;
      }
      
      // Get thumbnail from image or media
      let thumbnail = null;
      if (item.image && item.image.url) {
        thumbnail = item.image.url;
      } else if (item.media && item.media.length > 0 && item.media[0].image) {
        thumbnail = item.media[0].image;
      } else if (videoId) {
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
      
      const video = {
        id: videoId,
        title: item.title || 'Untitled',
        link: item.url || `https://www.youtube.com/watch?v=${videoId}`,
        published: item.published || new Date(),
        channelName: channelName,
        thumbnail: thumbnail,
        description: item.description || item.content || ''
      };
      
      logger.debug(`Processed video ${index + 1}`, {
        videoId: video.id,
        title: video.title,
        published: video.published,
        link: video.link,
        channelName: video.channelName
      });
      
      return video;
    }).filter(video => video.id); // Remove items without video IDs
    
    logger.debug(`After filtering: ${videos.length} videos with IDs`);

    return {
      title: feed.title || 'YouTube Feed',
      videos,
      lastUpdated: new Date()
    };

  } catch (error) {
    throw new Error(`RSS parsing failed: ${error.message}`);
  }
}

/**
 * Extract video ID from YouTube URL if not available in feed
 */
function extractVideoIdFromLink(link) {
  if (!link) return null;
  
  const match = link.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Extract thumbnail URL from feed item or generate from video ID
 */
function extractThumbnail(item, videoId) {
  // Try to extract from media:thumbnail
  if (item['media:thumbnail']) {
    const thumbnail = Array.isArray(item['media:thumbnail']) 
      ? item['media:thumbnail'][0] 
      : item['media:thumbnail'];
    
    if (thumbnail && thumbnail.url) {
      return thumbnail.url;
    }
  }

  // Try to extract from media:group
  if (item['media:group'] && item['media:group']['media:thumbnail']) {
    const thumbnail = item['media:group']['media:thumbnail'];
    if (thumbnail && thumbnail.url) {
      return thumbnail.url;
    }
  }

  // Fallback to YouTube thumbnail URL format
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  return null;
}

/**
 * Check if video title matches keywords
 */
function matchesKeywords(title, keywords, matchType = 'any') {
  if (!keywords || keywords.length === 0) {
    logger.debug(`No keywords specified - matching all videos`, { title });
    return true; // No keywords means match all
  }

  const lowerTitle = title.toLowerCase();
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  let matches = false;
  if (matchType === 'all') {
    matches = lowerKeywords.every(keyword => lowerTitle.includes(keyword));
  } else {
    matches = lowerKeywords.some(keyword => lowerTitle.includes(keyword));
  }

  logger.debug(`Keyword matching for "${title}"`, {
    keywords: lowerKeywords,
    matchType,
    matches,
    lowerTitle
  });

  return matches;
}

/**
 * Fetch and parse videos from a channel feed
 */
async function fetchChannelVideos(channelId, keywords = [], matchType = 'any') {
  const url = getChannelFeedUrl(channelId);
  logger.logFeedFetch('channel', channelId, 'start');

  try {
    const xmlText = await fetchFeedXML(url);
    const feedData = await parseRSSFeed(xmlText);
    
    // Filter videos by keywords
    const matchedVideos = feedData.videos.filter(video => 
      matchesKeywords(video.title, keywords, matchType)
    );

    logger.logFeedFetch('channel', channelId, 'success');
    logger.debug(`Channel ${channelId}: ${feedData.videos.length} videos, ${matchedVideos.length} matched`);

    return {
      ...feedData,
      sourceType: 'channel',
      sourceId: channelId,
      videos: matchedVideos
    };

  } catch (error) {
    logger.error(`Failed to fetch channel ${channelId}`, error, { channelId });
    throw error;
  }
}

/**
 * Fetch and parse videos from a playlist feed
 */
async function fetchPlaylistVideos(playlistId, keywords = [], matchType = 'any') {
  const url = getPlaylistFeedUrl(playlistId);
  logger.logFeedFetch('playlist', playlistId, 'start');

  try {
    const xmlText = await fetchFeedXML(url);
    const feedData = await parseRSSFeed(xmlText);
    
    // Filter videos by keywords
    const matchedVideos = feedData.videos.filter(video => 
      matchesKeywords(video.title, keywords, matchType)
    );

    logger.logFeedFetch('playlist', playlistId, 'success');
    logger.debug(`Playlist ${playlistId}: ${feedData.videos.length} videos, ${matchedVideos.length} matched`);

    return {
      ...feedData,
      sourceType: 'playlist',
      sourceId: playlistId,
      videos: matchedVideos
    };

  } catch (error) {
    logger.error(`Failed to fetch playlist ${playlistId}`, error, { playlistId });
    throw error;
  }
}

/**
 * Fetch videos from all configured sources
 */
async function fetchAllVideos(config) {
  const promises = [];
  
  // Add channel fetch promises
  config.channelIds.forEach(channelId => {
    promises.push(
      fetchChannelVideos(channelId, config.keywords, config.matchType)
        .catch(error => {
          logger.warn(`Skipping failed channel ${channelId}`, { error: error.message });
          return null;
        })
    );
  });

  // Add playlist fetch promises
  config.playlistIds.forEach(playlistId => {
    promises.push(
      fetchPlaylistVideos(playlistId, config.keywords, config.matchType)
        .catch(error => {
          logger.warn(`Skipping failed playlist ${playlistId}`, { error: error.message });
          return null;
        })
    );
  });

  // Execute all fetches in parallel
  const results = await Promise.all(promises);
  
  // Filter out failed requests and combine all videos
  const validResults = results.filter(result => result !== null);
  const allVideos = validResults.flatMap(result => 
    result.videos.map(video => ({
      ...video,
      sourceType: result.sourceType,
      sourceId: result.sourceId
    }))
  );

  // Sort by published date (newest first)
  allVideos.sort((a, b) => new Date(b.published) - new Date(a.published));

  return {
    videos: allVideos,
    sourcesProcessed: validResults.length,
    sourcesTotal: promises.length
  };
}

export {
  fetchChannelVideos,
  fetchPlaylistVideos,
  fetchAllVideos,
  matchesKeywords,
  getChannelFeedUrl,
  getPlaylistFeedUrl
};