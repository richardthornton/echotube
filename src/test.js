/**
 * Test mode functionality for validating configuration and RSS feeds
 * Fetches videos without posting to Discord for safe configuration testing
 */

import { loadConfig, printConfigSummary } from './config.js';
import { initLogger, getLogger } from './logger.js';
import { fetchAllVideos } from './youtube.js';
import { createDiscordWebhook } from './discord.js';

const logger = getLogger();

/**
 * Format video information for console display
 */
function formatVideoForDisplay(video, index) {
  const publishedDate = new Date(video.published).toLocaleDateString();
  const sourceInfo = `${video.sourceType}:${video.sourceId}`;
  
  return `
  ${index + 1}. ${video.title}
     Channel: ${video.channelName}
     Published: ${publishedDate}
     Source: ${sourceInfo}
     URL: ${video.link}`;
}

/**
 * Display test results in a formatted way
 */
function displayTestResults(results, config) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 ECHOTUBE TEST MODE RESULTS');
  console.log('='.repeat(80));

  // Source summary
  console.log(`\n📊 SOURCES PROCESSED:`);
  console.log(`   • Total sources configured: ${config.channelIds.length + config.playlistIds.length}`);
  console.log(`   • Sources successfully fetched: ${results.sourcesProcessed}`);
  console.log(`   • Channels: ${config.channelIds.length} (${config.channelIds.join(', ')})`);
  console.log(`   • Playlists: ${config.playlistIds.length} (${config.playlistIds.join(', ')})`);

  // Keyword filtering summary
  console.log(`\n🔍 FILTERING:`);
  if (config.keywords.length > 0) {
    console.log(`   • Keywords: ${config.keywords.join(', ')}`);
    console.log(`   • Match type: ${config.matchType}`);
    console.log(`   • Videos matching keywords: ${results.videos.length}`);
  } else {
    console.log(`   • No keywords configured - all videos match`);
    console.log(`   • Total videos found: ${results.videos.length}`);
  }

  // Video results
  if (results.videos.length === 0) {
    console.log(`\n📺 VIDEOS FOUND: None`);
    console.log(`   No videos match your criteria. This could mean:`);
    console.log(`   • No recent videos contain your keywords`);
    console.log(`   • The channels/playlists haven't posted recently`);
    console.log(`   • The source IDs might be incorrect`);
  } else {
    console.log(`\n📺 VIDEOS FOUND (${Math.min(results.videos.length, 10)} of ${results.videos.length} shown):`);
    
    const videosToShow = results.videos.slice(0, 10);
    videosToShow.forEach((video, index) => {
      console.log(formatVideoForDisplay(video, index));
    });

    if (results.videos.length > 10) {
      console.log(`\n   ... and ${results.videos.length - 10} more videos`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test completed successfully!');
  
  if (!config.testMode) {
    console.log('💡 To run in production mode, remove ET_TEST_MODE or set it to false');
  }
  
  console.log('='.repeat(80) + '\n');
}

/**
 * Test webhook connectivity if URL is provided
 */
async function testWebhookConnectivity(config) {
  if (!config.discordWebhookUrl) {
    console.log('🔗 WEBHOOK TEST: Skipped (no webhook URL provided)');
    return true;
  }

  console.log('🔗 WEBHOOK TEST: Testing Discord webhook connectivity...');
  
  try {
    const webhook = createDiscordWebhook(config.discordWebhookUrl);
    const result = await webhook.testWebhook();
    
    if (result.success) {
      console.log('✅ Webhook test successful - Discord connection working!');
      return true;
    } else {
      console.log(`❌ Webhook test failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook test failed: ${error.message}`);
    return false;
  }
}

/**
 * Display configuration validation results
 */
function displayConfigValidation(config) {
  console.log('\n🔧 CONFIGURATION VALIDATION:');
  
  const validations = [
    {
      name: 'Content Sources',
      valid: config.channelIds.length > 0 || config.playlistIds.length > 0,
      message: `${config.channelIds.length} channels, ${config.playlistIds.length} playlists`
    },
    {
      name: 'Poll Interval',
      valid: config.pollIntervalSeconds >= 60,
      message: `${config.pollIntervalSeconds} seconds`
    },
    {
      name: 'Keywords',
      valid: true,
      message: config.keywords.length > 0 ? `${config.keywords.length} keywords` : 'No filtering (all videos)'
    },
    {
      name: 'Log Level',
      valid: ['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(config.logLevel),
      message: config.logLevel
    },
    {
      name: 'Cache File',
      valid: true,
      message: config.cacheFile ? config.cacheFile : 'Memory only'
    }
  ];

  validations.forEach(validation => {
    const status = validation.valid ? '✅' : '❌';
    console.log(`   ${status} ${validation.name}: ${validation.message}`);
  });

  // Warnings
  if (config.channelIds.length > 0 && config.playlistIds.length > 0) {
    console.log('\n⚠️  WARNING: You are monitoring both channels and playlists.');
    console.log('   This may cause duplicate notifications if playlists belong to monitored channels.');
  }

  if (config.pollIntervalSeconds < 300) {
    console.log('\n⚠️  WARNING: Poll interval is less than 5 minutes.');
    console.log('   Very frequent polling may hit rate limits or be considered abusive.');
  }
}

/**
 * Run comprehensive test mode
 */
async function runTestMode() {
  try {
    console.log('🧪 EchoTube Test Mode Starting...\n');

    // Load and validate configuration
    console.log('📋 Loading configuration...');
    const config = loadConfig();
    
    // Initialize logger
    initLogger(config.logLevel);
    logger.info('Test mode initialized');

    // Display configuration validation
    displayConfigValidation(config);

    // Test webhook if provided
    await testWebhookConnectivity(config);

    // Fetch videos from all sources
    console.log('\n📡 Fetching videos from RSS feeds...');
    const results = await fetchAllVideos(config);

    // Display results
    displayTestResults(results, config);

    // Test completed successfully
    return true;

  } catch (error) {
    console.error('\n❌ Test mode failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.name === 'ConfigError') {
      console.error('\n💡 Configuration help:');
      console.error('   • Ensure ET_CHANNEL_IDS and/or ET_PLAYLIST_IDS are set');
      console.error('   • Channel IDs should start with "UC" and be 24 characters');
      console.error('   • Playlist IDs should start with "PL" and be 34 characters');
      console.error('   • Check that ET_DISCORD_WEBHOOK_URL is valid (if not in test mode)');
    }

    return false;
  }
}

export { runTestMode, displayTestResults, testWebhookConnectivity };