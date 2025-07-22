#!/usr/bin/env node

/**
 * EchoTube - Main entry point
 * YouTube RSS monitor with Discord webhook notifications
 */

import { loadConfig, printConfigSummary, ConfigError } from './config.js';
import { initLogger, getLogger } from './logger.js';
import { fetchAllVideos } from './youtube.js';
import { createDiscordWebhook } from './discord.js';
import { createVideoCache } from './cache.js';
import { runTestMode } from './test.js';

// Global instances
let logger;
let config;
let discordWebhook;
let videoCache;
let isShuttingDown = false;
let pollingInterval;
let pollingCycleCount = 0;

/**
 * Initialize application components
 */
async function initialize() {
  try {
    // Load configuration
    config = loadConfig();
    
    // Initialize logger
    logger = initLogger(config.logLevel);
    logger.logStartup(config);

    // Print configuration summary
    printConfigSummary(config);

    // Initialize video cache
    videoCache = createVideoCache(config.cacheFile);
    await videoCache.initialize();

    // Initialize Discord webhook (if not in test mode)
    if (!config.testMode) {
      discordWebhook = createDiscordWebhook(config.discordWebhookUrl);
    }

    logger.info('EchoTube initialized successfully');
    return true;

  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`❌ Configuration Error: ${error.message}`);
      process.exit(1);
    } else {
      console.error(`❌ Initialization Error: ${error.message}`);
      process.exit(1);
    }
  }
}

/**
 * Process videos - filter new ones and post notifications
 */
async function processVideos(videos) {
  if (videos.length === 0) {
    logger.debug('No videos found in current polling cycle');
    return { processed: 0, posted: 0 };
  }

  // Determine the mode for processing
  let mode = 'production';
  if (config.testMode) {
    mode = 'test';
  } else if (config.developmentMode) {
    mode = 'development';
  }

  // Check if this is an initial run
  const isInitialRun = videoCache.isInitialRun();
  
  if (isInitialRun) {
    logger.info('Detected initial application run', { 
      mode, 
      totalVideos: videos.length 
    });
  }

  // Filter new videos using cache with mode-specific logic
  const newVideos = videoCache.processVideos(videos, isInitialRun, mode);
  
  if (newVideos.length === 0) {
    if (isInitialRun && mode === 'production') {
      logger.info('Initial run complete: all existing videos marked as seen, ready for new video detection');
    } else {
      logger.debug('No new videos found');
    }
    return { processed: videos.length, posted: 0 };
  }

  logger.info(`Found ${newVideos.length} videos to post`, {
    mode,
    isInitialRun,
    totalVideos: videos.length,
    videosToPost: newVideos.length
  });

  // Post Discord notifications (if not in test mode)
  let postedCount = 0;
  if (!config.testMode && discordWebhook) {
    try {
      const results = await discordWebhook.postVideoNotifications(newVideos);
      postedCount = results.filter(r => r.success).length;
      
      const failedCount = results.length - postedCount;
      if (failedCount > 0) {
        logger.warn(`Some Discord notifications failed`, { 
          failed: failedCount, 
          successful: postedCount 
        });
      }
    } catch (error) {
      logger.error('Failed to send Discord notifications', error);
    }
  }

  // Save cache after processing
  await videoCache.save();

  return { processed: videos.length, posted: postedCount };
}

/**
 * Single polling cycle
 */
async function performPollingCycle() {
  if (isShuttingDown) {
    return;
  }

  pollingCycleCount++;
  logger.debug(`Starting polling cycle ${pollingCycleCount}`);

  try {
    // Fetch videos from all sources
    const results = await fetchAllVideos(config);
    
    // Process videos (filter new ones and post notifications)
    const processResults = await processVideos(results.videos);

    // Log cycle completion
    logger.logPollingCycle(
      pollingCycleCount,
      results.sourcesProcessed,
      processResults.processed,
      processResults.posted
    );

    // Cleanup cache periodically (every 50 cycles)
    if (pollingCycleCount % 50 === 0) {
      videoCache.cleanup();
    }

  } catch (error) {
    logger.error(`Polling cycle ${pollingCycleCount} failed`, error);
    
    // Continue operation even if one cycle fails
    // The next cycle will attempt to recover using cached timestamps
  }
}

/**
 * Start polling loop
 */
function startPolling() {
  if (config.testMode) {
    logger.info('Test mode enabled - skipping polling loop');
    return;
  }

  logger.info(`Starting polling loop`, {
    interval: `${config.pollIntervalSeconds} seconds`,
    sources: {
      channels: config.channelIds.length,
      playlists: config.playlistIds.length
    }
  });

  // Start first cycle immediately
  performPollingCycle();

  // Schedule subsequent cycles
  pollingInterval = setInterval(() => {
    performPollingCycle();
  }, config.pollIntervalSeconds * 1000);
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, forcing exit');
    process.exit(1);
  }

  isShuttingDown = true;
  logger.logShutdown(signal);

  try {
    // Clear polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Save cache
    if (videoCache) {
      await videoCache.shutdown();
    }

    // Wait for any pending Discord webhooks
    if (discordWebhook) {
      const queueStatus = discordWebhook.getQueueStatus();
      if (queueStatus.queueLength > 0) {
        logger.info(`Waiting for ${queueStatus.queueLength} pending Discord notifications`);
        // Give some time for queue to process
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    logger.info('EchoTube shutdown complete');
    process.exit(0);

  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers() {
  // Handle graceful shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle process errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (logger) {
      logger.error('Uncaught exception', error);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (logger) {
      logger.error('Unhandled promise rejection', reason);
    }
    process.exit(1);
  });
}

/**
 * Main application entry point
 */
async function main() {
  // Setup signal handlers first
  setupSignalHandlers();

  // Initialize application
  await initialize();

  // Check if running in test mode
  if (config.testMode) {
    logger.info('Running in test mode');
    const success = await runTestMode();
    process.exit(success ? 0 : 1);
  }

  // Start normal operation
  startPolling();

  // Keep process running
  logger.info('EchoTube is running. Press Ctrl+C to stop gracefully.');
}

// Handle ES module top-level execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, initialize, startPolling, gracefulShutdown };