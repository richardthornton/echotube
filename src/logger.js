/**
 * Structured logging module with configurable levels
 * Provides JSON-formatted logs with timestamps and context
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    this.levelName = level.toUpperCase();
  }

  /**
   * Format log entry with timestamp and structured data
   */
  _formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Check if log level should be output
   */
  _shouldLog(level) {
    return LOG_LEVELS[level] >= this.level;
  }

  /**
   * Debug level logging
   */
  debug(message, data = {}) {
    if (this._shouldLog('DEBUG')) {
      console.log(this._formatLog('DEBUG', message, data));
    }
  }

  /**
   * Info level logging
   */
  info(message, data = {}) {
    if (this._shouldLog('INFO')) {
      console.log(this._formatLog('INFO', message, data));
    }
  }

  /**
   * Warning level logging
   */
  warn(message, data = {}) {
    if (this._shouldLog('WARN')) {
      console.warn(this._formatLog('WARN', message, data));
    }
  }

  /**
   * Error level logging
   */
  error(message, error = null, data = {}) {
    if (this._shouldLog('ERROR')) {
      const errorData = { ...data };
      
      if (error) {
        errorData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      }

      console.error(this._formatLog('ERROR', message, errorData));
    }
  }

  /**
   * Log RSS feed fetch attempt
   */
  logFeedFetch(feedType, feedId, status = 'start') {
    this.debug(`RSS feed fetch ${status}`, {
      feedType,
      feedId,
      operation: 'rss_fetch'
    });
  }

  /**
   * Log video processing
   */
  logVideoProcessed(videoId, title, matched, keywords) {
    this.info('Video processed', {
      videoId,
      title,
      matched,
      keywords,
      operation: 'video_process'
    });
  }

  /**
   * Log Discord webhook post
   */
  logDiscordPost(videoId, success, error = null) {
    if (success) {
      this.info('Discord notification sent', {
        videoId,
        operation: 'discord_post'
      });
    } else {
      this.error('Discord notification failed', error, {
        videoId,
        operation: 'discord_post'
      });
    }
  }

  /**
   * Log cache operations
   */
  logCacheOperation(operation, videoCount, cacheFile = null) {
    this.debug(`Cache ${operation}`, {
      videoCount,
      cacheFile,
      operation: 'cache'
    });
  }

  /**
   * Log rate limiting
   */
  logRateLimit(delayMs, queueSize) {
    this.warn('Rate limit applied', {
      delayMs,
      queueSize,
      operation: 'rate_limit'
    });
  }

  /**
   * Log polling cycle
   */
  logPollingCycle(cycleNumber, feedCount, videosFound, videosMatched) {
    this.info('Polling cycle complete', {
      cycleNumber,
      feedCount,
      videosFound,
      videosMatched,
      operation: 'polling_cycle'
    });
  }

  /**
   * Log application startup
   */
  logStartup(config) {
    this.info('EchoTube starting', {
      version: '1.0.0',
      nodeVersion: process.version,
      logLevel: this.levelName,
      testMode: config.testMode,
      channels: config.channelIds.length,
      playlists: config.playlistIds.length,
      pollInterval: config.pollIntervalSeconds,
      operation: 'startup'
    });
  }

  /**
   * Log graceful shutdown
   */
  logShutdown(signal) {
    this.info('EchoTube shutting down gracefully', {
      signal,
      operation: 'shutdown'
    });
  }
}

// Create singleton logger instance
let logger = null;

/**
 * Initialize logger with specified level
 */
function initLogger(level = 'INFO') {
  logger = new Logger(level);
  return logger;
}

/**
 * Get current logger instance
 */
function getLogger() {
  if (!logger) {
    logger = new Logger();
  }
  return logger;
}

export { Logger, initLogger, getLogger };