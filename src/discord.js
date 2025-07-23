/**
 * Discord webhook integration with rate limiting and multi-webhook support
 * Implements queue-based system respecting Discord's 5 requests per 2 seconds limit
 * Supports posting to multiple webhook URLs simultaneously
 */

import { getLogger } from './logger.js';

const logger = getLogger();

// Discord rate limiting: 5 requests per 2 seconds
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 2000;

class DiscordWebhook {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.requestQueue = [];
    this.requestTimestamps = [];
    this.isProcessing = false;
  }

  /**
   * Check if we can make a request within rate limits
   */
  _canMakeRequest() {
    const now = Date.now();
    
    // Remove timestamps older than the rate limit window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    return this.requestTimestamps.length < RATE_LIMIT_REQUESTS;
  }

  /**
   * Calculate delay needed to respect rate limits
   */
  _calculateDelay() {
    if (this.requestTimestamps.length === 0) {
      return 0;
    }

    const now = Date.now();
    const oldestRequest = this.requestTimestamps[0];
    const timeSinceOldest = now - oldestRequest;
    
    if (timeSinceOldest >= RATE_LIMIT_WINDOW_MS) {
      return 0;
    }

    return RATE_LIMIT_WINDOW_MS - timeSinceOldest;
  }

  /**
   * Process the request queue with rate limiting
   */
  async _processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      if (!this._canMakeRequest()) {
        const delay = this._calculateDelay();
        logger.logRateLimit(delay, this.requestQueue.length);
        await this._sleep(delay);
      }

      const { payload, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await this._sendWebhook(payload);
        this.requestTimestamps.push(Date.now());
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Sleep for specified milliseconds
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send webhook request with retry logic
   */
  async _sendWebhook(payload, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 1000;

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EchoTube/1.0.0 (Discord Bot)'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        // Rate limited by Discord
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, retryCount);
        
        if (retryCount < maxRetries) {
          logger.warn(`Discord rate limited, retrying in ${delay}ms`, { retryCount });
          await this._sleep(delay);
          return this._sendWebhook(payload, retryCount + 1);
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json().catch(() => ({ success: true }));

    } catch (error) {
      if (retryCount < maxRetries && error.name !== 'AbortError') {
        const delay = baseDelay * Math.pow(2, retryCount);
        logger.warn(`Webhook request failed, retrying in ${delay}ms`, { 
          error: error.message, 
          retryCount 
        });
        await this._sleep(delay);
        return this._sendWebhook(payload, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Create Discord embed for a video
   */
  _createVideoEmbed(video) {
    const embed = {
      title: video.title,
      url: video.link,
      color: 0xFF0000, // YouTube red
      author: {
        name: video.channelName,
        url: `https://www.youtube.com/channel/${video.sourceType === 'channel' ? video.sourceId : ''}`
      }
    };

    // Add larger thumbnail as main image if available
    if (video.thumbnail) {
      // Use maxresdefault for larger thumbnail, fallback to hqdefault
      let largeThumbUrl = video.thumbnail;
      if (video.id) {
        largeThumbUrl = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;
      }
      
      embed.image = {
        url: largeThumbUrl
      };
    }

    return embed;
  }

  /**
   * Queue a video notification for sending
   */
  async postVideoNotification(video) {
    return new Promise((resolve, reject) => {
      const embed = this._createVideoEmbed(video);
      const payload = {
        embeds: [embed]
      };

      this.requestQueue.push({
        payload,
        resolve,
        reject
      });

      // Start processing queue
      this._processQueue().catch(error => {
        logger.error('Queue processing error', error);
      });
    });
  }

  /**
   * Send multiple video notifications
   */
  async postVideoNotifications(videos) {
    const results = [];
    
    for (const video of videos) {
      try {
        await this.postVideoNotification(video);
        logger.logDiscordPost(video.id, true);
        results.push({ video: video.id, success: true });
      } catch (error) {
        logger.logDiscordPost(video.id, false, error);
        results.push({ video: video.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook() {
    const testPayload = {
      content: '🧪 **Test Message**\n\nWebhook connection successful! Bot is configured and ready to monitor YouTube feeds.'
    };

    try {
      await this._sendWebhook(testPayload);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      recentRequests: this.requestTimestamps.length
    };
  }
}

/**
 * Multi-webhook manager for posting to multiple Discord servers
 */
class MultiDiscordWebhook {
  constructor(webhookUrls) {
    if (!webhookUrls || !Array.isArray(webhookUrls) || webhookUrls.length === 0) {
      throw new Error('At least one Discord webhook URL is required');
    }
    
    this.webhooks = webhookUrls.map(url => new DiscordWebhook(url));
    logger.info(`Initialized ${this.webhooks.length} Discord webhooks`);
  }

  /**
   * Post video notification to all configured webhooks
   */
  async postVideoNotification(video) {
    const results = [];
    
    // Post to all webhooks in parallel
    const promises = this.webhooks.map(async (webhook, index) => {
      try {
        await webhook.postVideoNotification(video);
        logger.logDiscordPost(video.id, true, null, index + 1);
        return { webhookIndex: index, success: true };
      } catch (error) {
        logger.logDiscordPost(video.id, false, error, index + 1);
        return { webhookIndex: index, success: false, error: error.message };
      }
    });

    const webhookResults = await Promise.allSettled(promises);
    
    // Process results
    webhookResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({ 
          webhookIndex: index, 
          success: false, 
          error: result.reason?.message || 'Unknown error' 
        });
      }
    });

    return results;
  }

  /**
   * Post multiple video notifications to all webhooks
   */
  async postVideoNotifications(videos) {
    const allResults = [];
    
    for (const video of videos) {
      const webhookResults = await this.postVideoNotification(video);
      allResults.push({
        videoId: video.id,
        webhookResults
      });
    }

    return allResults;
  }

  /**
   * Test all webhook connections
   */
  async testWebhooks() {
    const results = [];
    
    const promises = this.webhooks.map(async (webhook, index) => {
      try {
        const result = await webhook.testWebhook();
        return { webhookIndex: index + 1, ...result };
      } catch (error) {
        return { 
          webhookIndex: index + 1, 
          success: false, 
          error: error.message 
        };
      }
    });

    const webhookResults = await Promise.allSettled(promises);
    
    webhookResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({ 
          webhookIndex: index + 1, 
          success: false, 
          error: result.reason?.message || 'Unknown error' 
        });
      }
    });

    return results;
  }

  /**
   * Get status of all webhook queues
   */
  getQueueStatus() {
    return this.webhooks.map((webhook, index) => ({
      webhookIndex: index + 1,
      ...webhook.getQueueStatus()
    }));
  }
}

/**
 * Create Discord webhook instance
 */
function createDiscordWebhook(webhookUrl) {
  if (!webhookUrl) {
    throw new Error('Discord webhook URL is required');
  }
  
  return new DiscordWebhook(webhookUrl);
}

/**
 * Create multi-webhook instance for multiple Discord servers
 */
function createMultiDiscordWebhook(webhookUrls) {
  return new MultiDiscordWebhook(webhookUrls);
}

export { DiscordWebhook, MultiDiscordWebhook, createDiscordWebhook, createMultiDiscordWebhook };