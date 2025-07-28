# EchoTube 🎬📺

[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/richardthornton) [![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/richardthornton)

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
- 🌐 **Multi-Server Support** - Post to multiple Discord servers simultaneously
- 🛠️ **Zero Configuration Complexity** - Pure environment variable setup
- 📦 **Single Docker Container** - Production-ready with security hardening
- 🧠 **Intelligent Caching** - Prevents duplicates with timestamp-based recovery
- 🧪 **Comprehensive Test Mode** - Safe validation without posting to Discord
- 📊 **Production Logging** - Structured JSON logs with configurable levels
- 🚀 **Smart Initial Run** - Won't spam Discord on first startup

---

## 🚀 Quick Start

### Step 1: Test Your Setup (Recommended First Step!)

```bash
# This is completely safe - it won't post anything to Discord
docker run --rm \
  -e ET_TEST_MODE=true \
  -e ET_CHANNEL_IDS=UCexample1 \
  -e ET_KEYWORDS=minecraft,gaming \
  -e ET_LOG_LEVEL=DEBUG \
  richardthornton/echotube:latest
```

### Step 2: Get Your Configuration Ready

You'll need:
- 🔗 **Discord Webhook URL(s)** - [Create one here](https://support.discord.com/hc/en-us/articles/228383668) (can use multiple for different servers)
- 📺 **YouTube Channel IDs** - Found in URLs (format: `UCxxxxxxxxxxxxxxxxxx`)
- 🔍 **Keywords** - What words to look for in video titles

### Step 3: Run EchoTube

**Option A: Docker Run (Simple)**
```bash
docker run -d \
  --name=echotube \
  -e ET_CHANNEL_IDS=UCexample1,UCexample2 \
  -e ET_KEYWORDS=minecraft,gaming,tutorial \
  -e ET_DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/... \
  -v ./cache:/app/cache \
  richardthornton/echotube:latest
```

**Option B: Docker Compose (Recommended)**
```bash
# Get the template files
curl -O https://raw.githubusercontent.com/richardthornton/echotube/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/richardthornton/echotube/main/.env.example

# Set up your configuration
cp .env.example .env
# Edit .env with your settings

# Start EchoTube
docker-compose up -d
```

---

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ET_DISCORD_WEBHOOK_URLS` | Discord webhook URLs - comma-separated for multiple servers ([How to create](https://support.discord.com/hc/en-us/articles/228383668)) | `https://discord.com/api/webhooks/...` or `https://discord.com/api/webhooks/url1,https://discord.com/api/webhooks/url2` |
| `ET_KEYWORDS` | Comma-separated search terms | `minecraft,gaming,tutorial` |

### Content Sources (at least one required)

| Variable | Description | Example |
|----------|-------------|---------|
| `ET_CHANNEL_IDS` | Comma-separated YouTube channel IDs | `UCexample1,UCexample2` |
| `ET_PLAYLIST_IDS` | Comma-separated YouTube playlist IDs | `PLexample1,PLexample2` |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
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

- **Gaming Communities**: Monitor favorite streamers and post to multiple Discord servers
- **Educational Content**: Track programming tutorials and share across learning communities  
- **Content Curation**: Automatically share relevant videos in multiple community Discord servers
- **Development Updates**: Get notified about software releases in both team and public servers
- **Entertainment**: Follow content creators and cross-post to different interest-based servers

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

## 🐛 Need Help?

**Something not working?** Here's how to troubleshoot:

1. **Always test first**: Use `ET_TEST_MODE=true` to validate your setup safely
2. **Check the basics**: Verify your Discord webhook URLs are active and YouTube channel IDs are correct
3. **Look at logs**: Run `docker logs echotube` to see what's happening (logs show webhook-specific success/failures)
4. **Common issues**: Keywords are case-insensitive, RSS feeds only show 25 recent videos, and invalid webhook URLs will cause posting failures

Still stuck? [Open an issue](https://github.com/richardthornton/echotube/issues) and we'll help you out!

---

## 💖 Support This Project

If EchoTube saves you time and makes your Discord server better, consider buying me a coffee! Your support helps keep this project maintained and improves it for everyone.

[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/richardthornton) [![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/richardthornton)

Every contribution, no matter how small, helps maintain and improve EchoTube for the community. Thank you! 🙏

---

## 🤝 Contributing

Want to make EchoTube even better? We'd love your help!

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Test with `ET_TEST_MODE=true`
5. Submit a pull request

See our [Contributing Guide](CONTRIBUTING.md) for more details.

---

## 📋 Installation Options

**Docker Hub (Recommended)**
```bash
docker pull richardthornton/echotube:latest
```

**GitHub Container Registry**
```bash
docker pull ghcr.io/richardthornton/echotube:latest  
```

**From Source**
```bash
git clone https://github.com/richardthornton/echotube.git
cd echotube && npm install && npm start
```

---

## 📄 License

MIT License © [Richard Thornton](https://github.com/richardthornton) - Use it however you want!

---

*Made with ❤️ by [Richard Thornton](https://github.com/richardthornton)*

**EchoTube**: Clean YouTube notifications for Discord, the way they should be. ✨