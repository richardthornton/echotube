# Contributing to EchoTube

Thank you for your interest in contributing to EchoTube! We welcome contributions from the community and appreciate your help in making this project better.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Check existing issues** - Someone might have already reported the same problem
2. **Use the latest version** - Make sure you're using the most recent release
3. **Test in a clean environment** - Try reproducing the issue with minimal configuration

When creating an issue, please include:
- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (Docker version, OS, etc.)
- **Configuration** (sanitized - remove webhook URLs and sensitive data)
- **Relevant logs** (use `ET_LOG_LEVEL=DEBUG` for detailed output)

### Suggesting Features

We love new ideas! When suggesting features:

1. **Check existing discussions** - Your idea might already be under consideration
2. **Start with a discussion** - Open a GitHub Discussion to get community feedback
3. **Keep it focused** - One feature request per issue
4. **Explain the use case** - Help us understand why this would be valuable

### Code Contributions

#### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/echotube.git
   cd echotube
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Environment

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   # Edit .env with your test configuration
   ```

2. **Use test mode for development**:
   ```bash
   ET_TEST_MODE=true npm start
   ```

3. **Enable debug logging**:
   ```bash
   ET_LOG_LEVEL=DEBUG npm start
   ```

#### Code Style and Guidelines

- **Follow existing patterns** - Look at existing code for style guidance
- **Use meaningful names** - Variable and function names should be descriptive
- **Add comments** - Explain complex logic and business rules
- **Keep functions focused** - Each function should have a single responsibility
- **Handle errors gracefully** - Always include proper error handling

#### Testing Your Changes

1. **Test basic functionality**:
   ```bash
   ET_TEST_MODE=true ET_CHANNEL_IDS=UCexample ET_KEYWORDS=test npm start
   ```

2. **Test with Docker**:
   ```bash
   docker build -t echotube:test .
   docker run --rm -e ET_TEST_MODE=true -e ET_CHANNEL_IDS=UCexample echotube:test
   ```

3. **Test different configurations**:
   - Multiple channels
   - Different keyword matching modes  
   - Various polling intervals
   - Development mode

#### Submitting Your Changes

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what your changes do
   - Include testing instructions

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows the existing style and patterns
- [ ] All functionality works as expected
- [ ] No breaking changes (unless discussed first)
- [ ] No sensitive data (webhook URLs, personal channel IDs) in commits
- [ ] Changes are focused and atomic

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested in test mode
- [ ] Tested with Docker
- [ ] Tested different configurations

## Related Issues
Fixes #issue_number
```

## 🐛 Bug Reports

When reporting bugs, please include:

### Environment Information
- EchoTube version
- Docker version (if applicable)
- Operating system
- Node.js version (if running locally)

### Configuration (Sanitized)
```yaml
# Remove sensitive data like webhook URLs
ET_CHANNEL_IDS: "UCexample1,UCexample2"
ET_KEYWORDS: "minecraft,gaming"
ET_MATCH_TYPE: "any"
ET_POLL_INTERVAL_SECONDS: 300
ET_LOG_LEVEL: "DEBUG"
```

### Expected vs Actual Behavior
- What you expected to happen
- What actually happened
- Any error messages or logs

## 🚀 Feature Requests

Great features often come from community suggestions! When requesting features:

### Format Your Request
- **Problem**: What issue does this solve?
- **Solution**: How should it work?
- **Alternatives**: What other approaches did you consider?
- **Use Case**: When would you use this feature?

### Examples of Good Features
- Configuration improvements
- Better error handling
- Performance optimizations
- Additional deployment options
- Enhanced logging/monitoring

## 🔄 Development Workflow

### Branch Strategy
- `main` - Stable releases only
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation updates

### Commit Messages
Use clear, descriptive commit messages:

```
feat: add support for playlist monitoring
fix: handle rate limiting in Discord webhook
docs: update configuration examples
refactor: simplify RSS parsing logic
```

### Release Process
1. Features are merged to main
2. Version tags are created for releases
3. Docker images are automatically built
4. Release notes are generated

## 🏷️ Labels and Organization

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation updates
- `good first issue` - Good for newcomers
- `help wanted` - Community help needed

### Priority Labels
- `priority/high` - Critical issues
- `priority/medium` - Standard priority
- `priority/low` - Nice to have

## 📚 Resources

### Useful Documentation
- [YouTube RSS Feed Documentation](https://developers.google.com/youtube/v3/guides/implementation/player)
- [Discord Webhook Guide](https://support.discord.com/hc/en-us/articles/228383668)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Style Guide](https://github.com/felixge/node-style-guide)

### Getting Help
- **GitHub Discussions** - For questions and ideas
- **GitHub Issues** - For bugs and feature requests
- **Documentation** - Check README and wiki first

## 🙏 Recognition

Contributors are recognized in several ways:
- Listed in release notes for their contributions
- Mentioned in the README contributors section
- Badge recognition for significant contributions

## 📜 Code of Conduct

This project follows GitHub's Community Guidelines. Please be respectful and constructive in all interactions.

### Our Standards
- **Be welcoming** - Help newcomers feel included
- **Be respectful** - Disagreements are ok, personal attacks are not
- **Be constructive** - Focus on improving the project
- **Be patient** - Remember we're all volunteers

Thank you for contributing to EchoTube! 🎉