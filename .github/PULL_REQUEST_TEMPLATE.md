# Pull Request

## Description

Brief description of the changes in this PR.

## Type of Change

Please delete options that are not relevant:

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring (no functional changes)
- [ ] Test improvements

## Related Issues

Closes #(issue number)
Related to #(issue number)

## Changes Made

- [ ] Updated configuration handling
- [ ] Modified Discord integration
- [ ] Enhanced YouTube RSS processing
- [ ] Improved logging
- [ ] Updated documentation
- [ ] Added tests
- [ ] Other: ___________

## Testing

### Test Environment
- [ ] Tested locally with `npm start`
- [ ] Tested with Docker: `docker build -t echotube:test .`
- [ ] Tested in test mode: `ET_TEST_MODE=true`
- [ ] Tested with different configurations
- [ ] Tested error handling scenarios

### Test Results
<!-- Describe what you tested and the results -->

#### Configuration Tested
```yaml
# Sanitized configuration used for testing (remove sensitive data)
ET_CHANNEL_IDS: "UCexample1,UCexample2"  
ET_KEYWORDS: "test,example"
ET_MATCH_TYPE: "any"
ET_LOG_LEVEL: "DEBUG"
```

#### Test Output
```
# Include relevant test output or logs
```

## Screenshots (if applicable)

<!-- If your changes affect Discord embeds or output, include screenshots -->

## Checklist

### Code Quality
- [ ] My code follows the existing style and patterns
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors

### Testing
- [ ] I have tested my changes thoroughly
- [ ] My changes work correctly in test mode
- [ ] I have tested with different keyword configurations
- [ ] I have verified Discord webhook functionality (if applicable)

### Documentation
- [ ] I have made corresponding changes to the documentation
- [ ] My changes are reflected in the README if user-facing
- [ ] I have updated CHANGELOG.md if this is a notable change

### Security
- [ ] I have not included any sensitive data (webhook URLs, personal channel IDs)
- [ ] My changes don't introduce security vulnerabilities
- [ ] I have followed the principle of least privilege

### Breaking Changes
- [ ] My changes don't break existing configurations
- [ ] If this includes breaking changes, I have updated the version appropriately
- [ ] I have documented any breaking changes and migration steps

## Additional Notes

<!-- Any additional information that reviewers should know -->

### Deployment Impact
- [ ] No deployment changes required
- [ ] Requires environment variable updates
- [ ] Requires Docker image rebuild
- [ ] Requires configuration migration

### Performance Impact
- [ ] No performance impact
- [ ] Improves performance
- [ ] May impact performance (explain below)

### Future Considerations
<!-- Anything that should be considered for future development -->

---

## For Maintainers

### Review Checklist
- [ ] Code review completed
- [ ] Tests pass
- [ ] Documentation is adequate
- [ ] No sensitive data exposed
- [ ] Breaking changes properly handled
- [ ] Version bump required (if applicable)