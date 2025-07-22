# Changelog

All notable changes to EchoTube will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release preparation

## [1.0.0] - 2025-01-22

### Added
- **YouTube RSS Monitoring**: Monitor YouTube channels and playlists via RSS feeds
- **Keyword Matching**: Case-insensitive title filtering with "any" or "all" modes
- **Discord Integration**: Ultra-clean embeds with large thumbnails (1280x720)
- **Smart Initial Run**: Prevents Discord spam on first startup by marking existing videos as seen
- **Development Mode**: Post only one video per source for safe testing
- **Test Mode**: Validate configuration without posting to Discord
- **Production Logging**: Structured JSON logs with configurable levels
- **Docker Support**: Security-hardened container with multi-stage Alpine build
- **Rate Limiting**: Compliant with Discord's webhook rate limits (5 requests/2 seconds)
- **Intelligent Caching**: Timestamp-based recovery and duplicate prevention
- **Error Recovery**: Graceful handling of network issues and API failures

### Security
- **Non-root Container**: Runs as dedicated user (echotube:1001)
- **Minimal Dependencies**: Only one external package (@rowanmanning/feed-parser)
- **Input Validation**: Comprehensive environment variable validation
- **No API Keys Required**: Uses public RSS feeds only

### Performance
- **Native Node.js 20+**: Modern fetch API with AbortController
- **Efficient Polling**: Configurable intervals with smart caching
- **Small Container**: ~20MB final Docker image
- **Memory Efficient**: Minimal resource usage with optional file persistence

### Documentation
- **Comprehensive README**: User-focused documentation with examples
- **Configuration Guide**: Detailed environment variable reference
- **Docker Examples**: Production-ready compose configurations
- **Troubleshooting**: Common issues and solutions

## Release Notes

### v1.0.0 - Initial Release

EchoTube's first public release brings a complete YouTube monitoring solution with:

🎯 **Smart Monitoring**: RSS-based tracking with intelligent caching  
🎨 **Clean Notifications**: Beautiful Discord embeds without clutter  
🛡️ **Production Ready**: Security-hardened Docker container  
🧪 **Developer Friendly**: Test mode and comprehensive logging  

Perfect for Discord communities wanting automated YouTube notifications without spam or complexity.

### Upgrade Instructions

This is the initial release. For future upgrades:

1. **Docker Users**: Pull the new image and restart containers
   ```bash
   docker pull richardthornton/echotube:latest
   docker-compose up -d
   ```

2. **Manual Installation**: Update source and restart application
   ```bash
   git pull origin main
   npm install
   npm start
   ```

### Breaking Changes

None in this initial release.

### Migration Guide

Not applicable for initial release.

---

## Version History

- **1.0.0** - Initial public release with core functionality
- **Future releases** - Will be documented here following semantic versioning

## Support

For questions, issues, or feature requests:
- 📖 Check the [documentation](https://github.com/richardthornton/echotube/wiki)
- 🐛 Report issues on [GitHub Issues](https://github.com/richardthornton/echotube/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/richardthornton/echotube/discussions)