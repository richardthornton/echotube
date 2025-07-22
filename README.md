# EchoTube 🎬📺

**EchoTube** is a lightweight, self-hosted bot that monitors YouTube channels or playlists for new videos containing specific keywords and posts ultra-clean notifications to Discord via webhooks.

Built with modern Node.js 20+ features, zero external dependencies (except RSS parser), and production-ready security.

[![Docker Hub](https://img.shields.io/docker/pulls/richardthornton/echotube)](https://hub.docker.com/r/richardthornton/echotube)
[![GitHub release](https://img.shields.io/github/release/richardthornton/echotube)](https://github.com/richardthornton/echotube/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🎯 **Smart YouTube Monitoring** - RSS-based channel and playlist tracking
- 🔍 **Flexible Keyword Matching** - Case-insensitive "any" or "all" matching modes  
- 🎨 **Ultra-Clean Discord Embeds** - Minimal design with large thumbnails (1280x720)
- 🛠️ **Zero Configuration Complexity** - Pure environment variable setup
- 📦 **Single Docker Container** - Production-ready with security hardening
- 🧠 **Intelligent Caching** - Prevents duplicates with timestamp-based recovery
- 🧪 **Comprehensive Test Mode** - Safe validation without posting to Discord
- 📊 **Production Logging** - Structured JSON logs with configurable levels
- 🚀 **Smart Initial Run** - Won't spam Discord on first startup

---

## 🚀 Quick Start

### 1. Test Your Configuration (Recommended)

```bash
# Safe testing without posting to Discord
docker run --rm \
  -e ET_TEST_MODE=true \
  -e ET_CHANNEL_IDS=UCexample1 \
  -e ET_KEYWORDS=minecraft,gaming \
  -e ET_LOG_LEVEL=DEBUG \
  richardthornton/echotube:latest
```

### 2. Production Deployment

```bash
# Docker run
docker run -d \
  --name=echotube \
  -e ET_CHANNEL_IDS=UCexample1,UCexample2 \
  -e ET_KEYWORDS=minecraft,gaming,tutorial \
  -e ET_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... \
  -e ET_POLL_INTERVAL_SECONDS=300 \
  -v ./cache:/app/cache \
  richardthornton/echotube:latest
```

### 3. Docker Compose (Recommended)

1. **Download the template:**
   ```bash
   curl -O https://raw.githubusercontent.com/richardthornton/echotube/main/docker-compose.yml
   curl -O https://raw.githubusercontent.com/richardthornton/echotube/main/.env.example
   ```

2. **Configure your environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord webhook URL and channel IDs
   ```

3. **Start EchoTube:**
   ```bash
   docker-compose up -d
   ```

---

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ET_DISCORD_WEBHOOK_URL` | Discord webhook URL ([How to create](https://support.discord.com/hc/en-us/articles/228383668)) | `https://discord.com/api/webhooks/...` |
| `ET_CHANNEL_IDS` | Comma-separated YouTube channel IDs | `UCexample1,UCexample2` |
| `ET_KEYWORDS` | Comma-separated search terms | `minecraft,gaming,tutorial` |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ET_PLAYLIST_IDS` | - | Comma-separated playlist IDs |
| `ET_MATCH_TYPE` | `any` | `any` (match any keyword) or `all` (match all keywords) |
| `ET_POLL_INTERVAL_SECONDS` | `300` | Poll frequency in seconds (minimum: 60) |
| `ET_LOG_LEVEL` | `INFO` | Log level: `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `ET_CACHE_FILE` | memory-only | Path for persistent video cache |
| `ET_TEST_MODE` | `false` | Set to `true` to test without posting to Discord |
| `ET_DEVELOPMENT_MODE` | `false` | Set to `true` to post only one video per source |

---

## 🎨 Discord Embed Preview

EchoTube creates beautiful, minimal Discord notifications featuring:

- **Channel Name** - Clickable link to the YouTube channel
- **Video Title** - Clickable link to the YouTube video  
- **Large Thumbnail** - High-resolution video preview (1280x720)
- **YouTube Red Color** - Clean, recognizable branding

**What's NOT included**: dates, footers, source info, or any clutter - just pure video content.

---

## 📋 Getting YouTube Channel/Playlist IDs

### Channel IDs (format: `UCxxxxxxxxxxxxxxxxxx`)
1. Go to the YouTube channel
2. Look at the URL: `youtube.com/channel/UCexample` or `youtube.com/c/channelname`  
3. If URL shows `/c/channelname`, view page source and search for `"channelId":"UC`

### Playlist IDs (format: `PLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
1. Go to the YouTube playlist
2. Look at the URL: `youtube.com/playlist?list=PLexample`
3. Copy everything after `list=`

---

## 🧪 Example Use Cases

- **Gaming Communities**: Monitor favorite streamers for new uploads
- **Educational Content**: Track programming tutorials or learning channels  
- **Content Curation**: Automatically share relevant videos in community Discord servers
- **Development Updates**: Get notified about software releases or development vlogs
- **Entertainment**: Follow content creators across multiple channels

---

## ⚠️ Important Notes

- **RSS Feed Limitation**: YouTube RSS feeds only show the **25 most recent videos**
- **Title-Only Matching**: Only matches video **titles** (descriptions/tags not available via RSS)
- **Public Content Only**: No access to private playlists or unlisted content
- **Duplicate Prevention**: Monitoring both channels AND their playlists may cause duplicate notifications
- **Rate Limiting**: Discord webhooks are rate-limited to prevent spam

---

## 🔧 Advanced Usage

### Test Mode
Perfect for validating your configuration:
```bash
ET_TEST_MODE=true docker-compose up echotube-test
```

### Development Mode  
Posts only one video per source for testing:
```bash
ET_DEVELOPMENT_MODE=true docker-compose up echotube-dev
```

### Custom Build
Build from source for development:
```bash
git clone https://github.com/richardthornton/echotube.git
cd echotube
docker build -t echotube:custom .
```

---

## 📊 Monitoring & Logs

EchoTube provides structured JSON logging with configurable levels:

```bash
# View logs
docker logs echotube

# Follow logs in real-time  
docker logs -f echotube

# Debug level logging
docker run -e ET_LOG_LEVEL=DEBUG richardthornton/echotube
```

Log entries include operation tracking, error details, and performance metrics.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Development Setup
1. Fork the repository
2. Clone your fork locally
3. Create a feature branch
4. Make your changes
5. Test with `ET_TEST_MODE=true`
6. Submit a pull request

---

## 🐛 Troubleshooting

### Common Issues

**Bot not posting videos:**
- Verify Discord webhook URL is correct
- Check that keywords match video titles (case-insensitive)
- Ensure channel/playlist IDs are correct format
- Use test mode to validate configuration

**Performance issues:**
- Reduce polling frequency if monitoring many channels
- Use persistent cache file to improve startup time
- Monitor logs for rate limiting messages

**Docker issues:**
- Ensure proper volume mounting for cache persistence
- Check container logs for startup errors
- Verify environment variables are set correctly

### Getting Help
- 📖 Check the [documentation](https://github.com/richardthornton/echotube/wiki)
- 🐛 Report issues on [GitHub Issues](https://github.com/richardthornton/echotube/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/richardthornton/echotube/discussions)

---

## 📦 Installation Methods

### Docker Hub
```bash
docker pull richardthornton/echotube:latest
```

### GitHub Container Registry
```bash
docker pull ghcr.io/richardthornton/echotube:latest  
```

### From Source
```bash
git clone https://github.com/richardthornton/echotube.git
cd echotube
npm install
npm start
```

---

## 🏷️ Version Tags

- `latest` - Latest stable release
- `v1.0.0` - Specific version tags
- `main` - Development branch (not recommended for production)

---

## 📄 License

MIT © [Richard Thornton](https://github.com/richardthornton)

See [LICENSE](LICENSE) for full details.

---

## 🙏 Acknowledgments

- Built with [Node.js](https://nodejs.org/) and modern container practices
- RSS parsing powered by [@rowanmanning/feed-parser](https://github.com/rowanmanning/feed-parser)  
- Inspired by the need for clean, minimal Discord bot notifications

---

## ⭐ Star History

If EchoTube helps you, please consider giving it a star! ⭐

*EchoTube: Because YouTube notifications should be clean and simple.* ✨