/**
 * Video cache module for tracking processed videos and persistence
 * Maintains latest video timestamps for error recovery
 */

import { promises as fs } from 'fs';
import { getLogger } from './logger.js';

const logger = getLogger();

class VideoCache {
  constructor(cacheFile = null) {
    this.cacheFile = cacheFile;
    this.seenVideoIds = new Set();
    this.latestVideoTimestamps = new Map(); // sourceId -> timestamp
    this.lastSaveTime = Date.now();
  }

  /**
   * Initialize cache from file if it exists
   */
  async initialize() {
    if (!this.cacheFile) {
      logger.debug('Cache running in memory-only mode');
      return;
    }

    try {
      const data = await fs.readFile(this.cacheFile, 'utf8');
      const cacheData = JSON.parse(data);
      
      // Load seen video IDs
      if (cacheData.seenVideoIds && Array.isArray(cacheData.seenVideoIds)) {
        this.seenVideoIds = new Set(cacheData.seenVideoIds);
      }

      // Load latest timestamps
      if (cacheData.latestVideoTimestamps) {
        this.latestVideoTimestamps = new Map(Object.entries(cacheData.latestVideoTimestamps));
      }

      logger.logCacheOperation('loaded', this.seenVideoIds.size, this.cacheFile);

    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.debug('Cache file does not exist, starting fresh', { cacheFile: this.cacheFile });
      } else {
        logger.warn('Failed to load cache file, starting fresh', { 
          error: error.message, 
          cacheFile: this.cacheFile 
        });
      }
    }
  }

  /**
   * Save cache to file
   */
  async save(force = false) {
    if (!this.cacheFile) {
      return; // Memory-only mode
    }

    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;
    
    // Only save if forced or it's been more than 30 seconds since last save
    if (!force && timeSinceLastSave < 30000) {
      return;
    }

    try {
      const cacheData = {
        seenVideoIds: Array.from(this.seenVideoIds),
        latestVideoTimestamps: Object.fromEntries(this.latestVideoTimestamps),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };

      await fs.writeFile(this.cacheFile, JSON.stringify(cacheData, null, 2));
      this.lastSaveTime = now;
      
      logger.logCacheOperation('saved', this.seenVideoIds.size, this.cacheFile);

    } catch (error) {
      logger.error('Failed to save cache file', error, { cacheFile: this.cacheFile });
    }
  }

  /**
   * Check if a video has been seen before
   */
  hasBeenSeen(videoId) {
    return this.seenVideoIds.has(videoId);
  }

  /**
   * Mark a video as seen
   */
  markAsSeen(videoId) {
    this.seenVideoIds.add(videoId);
  }

  /**
   * Mark multiple videos as seen
   */
  markMultipleAsSeen(videoIds) {
    videoIds.forEach(id => this.seenVideoIds.add(id));
  }

  /**
   * Update latest video timestamp for a source
   */
  updateLatestTimestamp(sourceId, timestamp) {
    const currentLatest = this.latestVideoTimestamps.get(sourceId);
    const newTimestamp = new Date(timestamp);
    
    if (!currentLatest || newTimestamp > new Date(currentLatest)) {
      this.latestVideoTimestamps.set(sourceId, newTimestamp.toISOString());
      logger.debug(`Updated latest timestamp for ${sourceId}`, { 
        timestamp: newTimestamp.toISOString() 
      });
    }
  }

  /**
   * Get latest video timestamp for a source
   */
  getLatestTimestamp(sourceId) {
    return this.latestVideoTimestamps.get(sourceId);
  }

  /**
   * Filter new videos that haven't been seen
   */
  filterNewVideos(videos) {
    return videos.filter(video => !this.hasBeenSeen(video.id));
  }

  /**
   * Process videos - filter new ones and update timestamps
   * @param {Array} videos - Array of video objects
   * @param {boolean} isInitialRun - Whether this is the first run (production mode)
   * @param {string} mode - 'production', 'development', or 'test'
   */
  processVideos(videos, isInitialRun = false, mode = 'production') {
    // Update latest timestamps for all sources first
    const sourceTimestamps = new Map();
    
    videos.forEach(video => {
      const sourceKey = `${video.sourceType}:${video.sourceId}`;
      const currentLatest = sourceTimestamps.get(sourceKey);
      const videoDate = new Date(video.published);
      
      if (!currentLatest || videoDate > currentLatest) {
        sourceTimestamps.set(sourceKey, videoDate);
      }
    });

    // Update cache with latest timestamps
    sourceTimestamps.forEach((timestamp, sourceKey) => {
      this.updateLatestTimestamp(sourceKey, timestamp);
    });

    // Handle initial run in production mode
    if (isInitialRun && mode === 'production') {
      logger.info('Initial production run: marking all existing videos as seen without posting', {
        videoCount: videos.length
      });
      
      // Mark all videos as seen but don't post any
      videos.forEach(video => this.markAsSeen(video.id));
      return []; // Return empty array - no videos to post
    }

    // Handle development mode - only return one video per source
    if (mode === 'development') {
      const newVideos = this.filterNewVideos(videos);
      const devVideos = [];
      const seenSources = new Set();
      
      // Get one video per source for development testing
      for (const video of newVideos) {
        const sourceKey = `${video.sourceType}:${video.sourceId}`;
        if (!seenSources.has(sourceKey)) {
          devVideos.push(video);
          seenSources.add(sourceKey);
        }
      }
      
      logger.info('Development mode: limiting to one video per source', {
        totalNewVideos: newVideos.length,
        devVideos: devVideos.length,
        sources: seenSources.size
      });
      
      // Mark all new videos as seen (not just the ones we're posting)
      newVideos.forEach(video => this.markAsSeen(video.id));
      return devVideos;
    }

    // Normal operation - return all new videos
    const newVideos = this.filterNewVideos(videos);
    newVideos.forEach(video => this.markAsSeen(video.id));
    return newVideos;
  }

  /**
   * Check if this appears to be an initial run
   * Based on whether we have any cached video IDs
   */
  isInitialRun() {
    return this.seenVideoIds.size === 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      seenVideos: this.seenVideoIds.size,
      trackedSources: this.latestVideoTimestamps.size,
      cacheFile: this.cacheFile || 'memory-only',
      lastSaveTime: new Date(this.lastSaveTime).toISOString(),
      isInitialRun: this.isInitialRun()
    };
  }

  /**
   * Filter videos by timestamp - only return videos newer than cached latest
   */
  filterByTimestamp(videos, sourceId) {
    const sourceKey = `channel:${sourceId}`;
    const playlistKey = `playlist:${sourceId}`;
    
    // Try both channel and playlist keys
    const latestTimestamp = this.getLatestTimestamp(sourceKey) || 
                           this.getLatestTimestamp(playlistKey);
    
    if (!latestTimestamp) {
      return videos; // No previous timestamp, return all
    }

    const latestDate = new Date(latestTimestamp);
    return videos.filter(video => new Date(video.published) > latestDate);
  }

  /**
   * Clean old entries to prevent memory bloat
   */
  cleanup(maxEntries = 10000) {
    if (this.seenVideoIds.size <= maxEntries) {
      return;
    }

    // Convert to array, sort by video ID (newest YouTube IDs are larger)
    const videoIds = Array.from(this.seenVideoIds).sort();
    
    // Keep only the most recent entries
    const toKeep = videoIds.slice(-maxEntries);
    
    this.seenVideoIds = new Set(toKeep);
    
    logger.info(`Cache cleaned: kept ${toKeep.length} most recent entries`);
  }

  /**
   * Graceful shutdown - save cache
   */
  async shutdown() {
    await this.save(true);
    logger.debug('Cache shutdown complete');
  }
}

/**
 * Create video cache instance
 */
function createVideoCache(cacheFile = null) {
  return new VideoCache(cacheFile);
}

export { VideoCache, createVideoCache };