# Contributing Guide

[中文](CONTRIBUTING.zh.md) | English

Thank you for your interest in contributing to KWeaver! We welcome all forms of contributions, including bug fixes, feature proposals, documentation improvements, answering questions, and more.

Please read this guide before submitting contributions to ensure consistent processes and standardized submissions.

---

## 🧩 Types of Contributions

You can contribute in the following ways:

- 🐛 **Report Bugs**: Help us identify and fix issues
- 🌟 **Propose Features**: Suggest new functionality or improvements
- 📚 **Improve Documentation**: Enhance docs, examples, or tutorials
- 🔧 **Fix Bugs**: Submit patches for existing issues
- 🚀 **Implement Features**: Build new functionality
- 🧪 **Add Tests**: Improve test coverage
- 🎨 **Refactor Code**: Optimize code structure and improve maintainability

---

## 🗂 Issue Guidelines (Bug & Feature)

### 1. Bug Report Format

When reporting a bug, please provide the following information:

- **Version/Environment**:
  - Go version (e.g., Go 1.23.0)
  - OS (Windows/Linux/macOS)
  - Database version (MariaDB 11.4+ / DM8)
  - OpenSearch version (if applicable)
  - Module affected (ontology-manager / ontology-query)

- **Reproduction Steps**: Clear, step-by-step instructions to reproduce the issue

- **Expected vs Actual Behavior**: What should happen vs what actually happens

- **Error Logs/Screenshots**: Include relevant error messages, stack traces, or screenshots

- **Minimal Reproducible Code (MRC)**: A minimal code example that demonstrates the issue

**Example Bug Report Template:**

```markdown
**Environment:**
- Go: 1.23.0
- OS: Linux Ubuntu 22.04
- Module: ontology-manager
- Database: MariaDB 11.4

**Steps to Reproduce:**
1. Start ontology-manager service
2. Create a new knowledge network
3. Attempt to delete the network
4. Error occurs

**Expected Behavior:**
Network should be deleted successfully

**Actual Behavior:**
Error: "network is in use"

**Error Log:**
[Paste error log here]
```

### 2. Feature Request Format

When proposing a feature, please describe:

- **Background/Purpose**: Why is this feature needed? What problem does it solve?

- **Feature Description**: Detailed description of the proposed functionality

- **API Design** (if applicable): Proposed API changes or new endpoints

- **Backward Compatibility**: Potential impact on existing functionality

- **Implementation Direction** (optional): Suggestions on how to implement it

> **Note**: All major features should be discussed in an Issue first before submitting a Pull Request.

**Example Feature Request Template:**

```markdown
**Background:**
Currently, users need to manually refresh the knowledge network after updates.
This feature would automate the refresh process.

**Feature Description:**
Add an auto-refresh mechanism that updates the knowledge network when
underlying data changes.

**Proposed API:**
POST /api/v1/networks/{id}/auto-refresh
{
  "enabled": true,
  "interval": 300
}

**Backward Compatibility:**
This is a new feature and does not affect existing functionality.
```

---

## 🔀 Pull Request (PR) Process

### 1. Fork the Repository

Fork the repository to your GitHub account.

### 2. Create a Branch

Create a new branch from `main` (or the appropriate base branch):

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/bug-description
```

**Branch Naming Convention:**

- `feature/` - for new features
- `fix/` - for bug fixes
- `docs/` - for documentation changes
- `refactor/` - for code refactoring
- `test/` - for adding or updating tests

### 3. Make Your Changes

- Write clean, maintainable code
- Follow the project's code structure and architecture patterns
- Add appropriate comments and documentation

### 4. Write Tests

- Add unit tests for new functionality
- Ensure existing tests still pass
- Aim for good test coverage

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
```

### 5. Update Documentation

- Update relevant documentation if your changes affect user-facing features
- Update API documentation if you modify endpoints
- Add examples if introducing new functionality
- Update CHANGELOG.md if applicable

### 6. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git commit -m "feat: add auto-refresh for knowledge networks

- Add auto-refresh configuration endpoint
- Implement background refresh worker
- Add tests for refresh functionality

Closes #123"
```

**Commit Message Format:**

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 7. Push to Your Fork

```bash
git push origin feature/my-feature
```

### 8. Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template with:
   - Description of changes
   - Related issue number (if applicable)
   - Testing instructions
   - Screenshots (if UI changes)

**PR Checklist:**

- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Changes are backward compatible (or migration guide provided)

---

## 📋 Code Review Process

1. **Automated Checks**: PRs will be checked by CI/CD pipelines
   - Unit tests
   - Build verification

2. **Review**: Maintainers will review your PR
   - Address review comments promptly
   - Make requested changes
   - Keep discussions constructive

3. **Approval**: Once approved, a maintainer will merge your PR

---

## 🏗 Development Setup

### Prerequisites

- Go 1.23.0 or higher
- MariaDB 11.4+ or DM8
- OpenSearch 2.x (optional, for full functionality)
- Git

### Local Development

1. **Clone your fork:**

```bash
git clone https://github.com/YOUR_USERNAME/kweaver.git
cd kweaver
```

2. **Add upstream remote:**

```bash
git remote add upstream https://github.com/AISHU-Technology/kweaver.git
```

3. **Set up the development environment:**

```bash
# Navigate to the module you want to work on
cd ontology/ontology-manager/server
# or
cd ontology/ontology-query/server

# Download dependencies
go mod download

# Run the service
go run main.go
```

4. **Run tests:**

```bash
go test ./...
```

---

## 🐛 Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
- Email: [Security contact email]
- Internal security reporting system

We will acknowledge receipt and work with you to address the issue.

---

## ❓ Getting Help

- **Documentation**: Check the [README](README.md) and module-specific docs
- **Issues**: Search existing issues before creating a new one
- **Discussions**: Use GitHub Discussions for questions and ideas

---

## 📜 License

By contributing to KWeaver, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to KWeaver! 🎉
