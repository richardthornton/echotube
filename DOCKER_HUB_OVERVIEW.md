# EchoTube - YouTube to Discord Bot

A lightweight, self-hosted bot that monitors YouTube channels and playlists for new videos containing specific keywords, then posts ultra-clean notifications to Discord via webhooks.

## Quick Start

```bash
# Test your configuration first (recommended)
docker run --rm \
  -e ET_TEST_MODE=true \
  -e ET_CHANNEL_IDS=UCexample1 \
  -e ET_KEYWORDS=minecraft,gaming \
  richardthornton/echotube:latest

# Production deployment
docker run -d \
  --name=echotube \
  -e ET_CHANNEL_IDS=UCexample1,UCexample2 \
  -e ET_KEYWORDS=minecraft,gaming \
  -e ET_DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/... \
  -v ./cache:/app/cache \
  richardthornton/echotube:latest
```

## Features

- 🎯 **Smart YouTube Monitoring** - RSS-based channel and playlist tracking
- 🔍 **Flexible Keyword Matching** - Case-insensitive "any" or "all" matching modes
- 🎨 **Ultra-Clean Discord Embeds** - Minimal design with large thumbnails
- 🌐 **Multi-Server Support** - Post to multiple Discord servers simultaneously
- 📦 **Single Docker Container** - Production-ready (~20MB Alpine image)
- 🧠 **Intelligent Caching** - Prevents duplicates with timestamp recovery
- 🧪 **Test Mode** - Safe configuration validation without posting
- 📊 **Structured Logging** - JSON logs with configurable levels
- 🔒 **Security Hardened** - Non-root user, minimal privileges

## Environment Variables

### Required
- `ET_DISCORD_WEBHOOK_URLS` - Your Discord webhook URLs (comma-separated for multiple servers)
- `ET_CHANNEL_IDS` - Comma-separated YouTube channel IDs (UCxxxxx format)
- `ET_KEYWORDS` - Comma-separated keywords to match in video titles

### Optional
- `ET_PLAYLIST_IDS` - Comma-separated playlist IDs (PLxxxxx format)
- `ET_MATCH_TYPE` - `any` (default) or `all` keyword matching
- `ET_POLL_INTERVAL_SECONDS` - Poll frequency (default: 300, minimum: 60)
- `ET_LOG_LEVEL` - `DEBUG`, `INFO` (default), `WARN`, `ERROR`
- `ET_CACHE_FILE` - Path for persistent cache (default: memory only)
- `ET_TEST_MODE` - Set to `true` to validate config without posting
- `ET_DEVELOPMENT_MODE` - Set to `true` to post only one video per source

## Docker Compose Example

```yaml
version: '3.8'
services:
  echotube:
    image: richardthornton/echotube:latest
    container_name: echotube
    restart: unless-stopped
    environment:
      - ET_CHANNEL_IDS=UCexample1,UCexample2
      - ET_KEYWORDS=minecraft,gaming,tutorial
      - ET_DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/...
      - ET_POLL_INTERVAL_SECONDS=300
      - ET_LOG_LEVEL=INFO
    volumes:
      - ./cache:/app/cache
```

## How to Get YouTube IDs

### Channel IDs (format: UCxxxxxxxxxxxxxxxxxx)
1. Go to YouTube channel
2. Check URL: `youtube.com/channel/UCexample` or view page source for `"channelId":"UC`

### Playlist IDs (format: PLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
1. Go to YouTube playlist  
2. Copy everything after `list=` in the URL

## Discord Webhook Setup

1. In Discord, go to Server Settings > Integrations > Webhooks
2. Click "Create Webhook"
3. Choose channel and copy the webhook URL
4. Use this URL for `ET_DISCORD_WEBHOOK_URLS` (can specify multiple URLs separated by commas)

## Health Check

The container includes a built-in health check that monitors the application status.

```bash
# Check container health
docker ps
```

## Logging

View structured JSON logs with timestamps and operation tracking:

```bash
# View logs
docker logs echotube

# Follow logs in real-time
docker logs -f echotube

# Debug logging
docker run -e ET_LOG_LEVEL=DEBUG richardthornton/echotube
```

## Available Tags

- `latest` - Latest stable release
- `v1.x.x` - Specific version tags
- `main` - Development branch (not recommended for production)

## Architecture

- **Base Image**: Alpine Linux (security-focused, ~20MB final size)
- **Runtime**: Node.js 20+ with native fetch API
- **Dependencies**: Minimal (only RSS parser)
- **User**: Non-root execution (echotube:1001)
- **Process Manager**: dumb-init for proper signal handling

## Use Cases

- **Gaming Communities** - Monitor streamers for new uploads
- **Educational Content** - Track programming tutorials
- **Content Curation** - Auto-share videos in Discord servers
- **Development Updates** - Get notified about releases

## Important Notes

- YouTube RSS feeds show only the **25 most recent videos**
- Only matches video **titles** (descriptions not available via RSS)
- **Public content only** - no private playlists
- Uses Discord webhook rate limiting to prevent spam
- On first run, marks existing videos as seen without posting

## Support

- **Documentation**: [GitHub Repository](https://github.com/richardthornton/echotube)
- **Issues**: [GitHub Issues](https://github.com/richardthornton/echotube/issues)
- **Source Code**: [GitHub](https://github.com/richardthornton/echotube)

## License

MIT © Richard Thornton

---

**EchoTube: Because YouTube notifications should be clean and simple.** ✨