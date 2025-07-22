/**
 * Configuration module with environment variable validation
 * Uses Node.js 20+ native environment handling
 */

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Parse and validate comma-separated list
 */
function parseCommaSeparated(value, name) {
  if (!value || value.trim() === '') {
    return [];
  }
  
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Validate YouTube channel ID format
 */
function validateChannelId(channelId) {
  if (!channelId.startsWith('UC') || channelId.length !== 24) {
    throw new ConfigError(`Invalid channel ID format: ${channelId}. Must start with 'UC' and be 24 characters long.`);
  }
  return channelId;
}

/**
 * Validate YouTube playlist ID format
 */
function validatePlaylistId(playlistId) {
  if (!playlistId.startsWith('PL') || playlistId.length !== 34) {
    throw new ConfigError(`Invalid playlist ID format: ${playlistId}. Must start with 'PL' and be 34 characters long.`);
  }
  return playlistId;
}

/**
 * Validate Discord webhook URL format
 */
function validateWebhookUrl(url) {
  if (!url) {
    throw new ConfigError('ET_DISCORD_WEBHOOK_URL is required');
  }
  
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'discord.com' && parsed.hostname !== 'discordapp.com') {
      throw new ConfigError('Discord webhook URL must be from discord.com or discordapp.com');
    }
    if (!parsed.pathname.startsWith('/api/webhooks/')) {
      throw new ConfigError('Invalid Discord webhook URL format');
    }
    return url;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`Invalid webhook URL format: ${error.message}`);
  }
}

/**
 * Validate and parse configuration from environment variables
 */
function loadConfig() {
  const config = {
    // Content sources
    channelIds: [],
    playlistIds: [],
    
    // Filtering
    keywords: [],
    matchType: 'any',
    
    // Discord integration
    discordWebhookUrl: null,
    
    // Operational settings
    pollIntervalSeconds: 300,
    cacheFile: null,
    logLevel: 'INFO',
    testMode: false
  };

  try {
    // Parse channel IDs
    const rawChannelIds = parseCommaSeparated(process.env.ET_CHANNEL_IDS, 'ET_CHANNEL_IDS');
    config.channelIds = rawChannelIds.map(validateChannelId);

    // Parse playlist IDs
    const rawPlaylistIds = parseCommaSeparated(process.env.ET_PLAYLIST_IDS, 'ET_PLAYLIST_IDS');
    config.playlistIds = rawPlaylistIds.map(validatePlaylistId);

    // Validate at least one content source
    if (config.channelIds.length === 0 && config.playlistIds.length === 0) {
      throw new ConfigError('At least one of ET_CHANNEL_IDS or ET_PLAYLIST_IDS must be provided');
    }

    // Parse keywords
    config.keywords = parseCommaSeparated(process.env.ET_KEYWORDS, 'ET_KEYWORDS');

    // Validate match type
    if (process.env.ET_MATCH_TYPE) {
      const matchType = process.env.ET_MATCH_TYPE.toLowerCase();
      if (matchType !== 'any' && matchType !== 'all') {
        throw new ConfigError('ET_MATCH_TYPE must be either "any" or "all"');
      }
      config.matchType = matchType;
    }

    // Validate Discord webhook URL (required unless in test mode)
    config.testMode = process.env.ET_TEST_MODE === 'true';
    if (!config.testMode) {
      config.discordWebhookUrl = validateWebhookUrl(process.env.ET_DISCORD_WEBHOOK_URL);
    }

    // Parse poll interval
    if (process.env.ET_POLL_INTERVAL_SECONDS) {
      const interval = parseInt(process.env.ET_POLL_INTERVAL_SECONDS, 10);
      if (isNaN(interval) || interval < 60) {
        throw new ConfigError('ET_POLL_INTERVAL_SECONDS must be a number >= 60');
      }
      config.pollIntervalSeconds = interval;
    }

    // Validate log level
    if (process.env.ET_LOG_LEVEL) {
      const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      const logLevel = process.env.ET_LOG_LEVEL.toUpperCase();
      if (!validLevels.includes(logLevel)) {
        throw new ConfigError(`ET_LOG_LEVEL must be one of: ${validLevels.join(', ')}`);
      }
      config.logLevel = logLevel;
    }

    // Optional cache file
    if (process.env.ET_CACHE_FILE) {
      config.cacheFile = process.env.ET_CACHE_FILE;
    }

    // Detect development mode based on environment or explicit setting
    config.developmentMode = process.env.ET_DEVELOPMENT_MODE === 'true' || 
                           process.env.NODE_ENV === 'development';

    return config;

  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Configuration error: ${error.message}`);
  }
}

/**
 * Print configuration summary (safe for logging)
 */
function printConfigSummary(config) {
  const summary = {
    channels: config.channelIds.length,
    playlists: config.playlistIds.length,
    keywords: config.keywords,
    matchType: config.matchType,
    pollInterval: `${config.pollIntervalSeconds}s`,
    logLevel: config.logLevel,
    testMode: config.testMode,
    cacheFile: config.cacheFile ? 'enabled' : 'memory-only'
  };

  console.log('Configuration loaded:');
  console.log(JSON.stringify(summary, null, 2));

  // Warning about potential duplicates
  if (config.channelIds.length > 0 && config.playlistIds.length > 0) {
    console.warn('⚠️  WARNING: Monitoring both channels and playlists may cause duplicate notifications if playlists belong to monitored channels.');
  }
}

export { loadConfig, printConfigSummary, ConfigError };