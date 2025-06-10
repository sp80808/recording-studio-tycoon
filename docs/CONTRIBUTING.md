# Contributing to Recording Studio Tycoon

Thank you for your interest in contributing to Recording Studio Tycoon! This document provides guidelines and instructions for contributing to the project.

## Development Workflow

### 1. Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```sh
   git clone https://github.com/YOUR_USERNAME/recording-studio-tycoon.git
   cd recording-studio-tycoon
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Create a new branch for your feature/fix:
   ```sh
   git checkout -b feature/your-feature-name
   ```

### 2. Development Guidelines

#### Code Style
- Follow the TypeScript style guide
- Use ESLint and Prettier for code formatting
- Run `npm run format` before committing
- Run `npm run lint` to check for issues

#### Component Development
- Use functional components with TypeScript
- Follow the project's component structure
- Add proper TypeScript types for props and state
- Include JSDoc comments for complex functions

#### Testing
- Write tests for new features and bug fixes
- Maintain or improve test coverage
- Run tests with `npm run test`
- Ensure all tests pass before submitting PR

### 3. Commit Guidelines

Follow conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for test changes
- `chore:` for maintenance tasks

Example:
```
feat: add staff training system
fix: resolve XP calculation bug
docs: update README with new features
```

### 4. Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update the changelog
5. Submit PR with clear description
6. Address review comments

### 5. Feature Development

#### Game Features
- Follow the game design document
- Maintain game balance
- Consider performance impact
- Add appropriate animations
- Include sound effects

#### UI/UX Features
- Follow the animation enhancement plan
- Maintain consistent styling
- Ensure responsive design
- Add proper loading states
- Include error handling

### 6. Bug Reports

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details

### 7. Code Review Process

- Review PRs promptly
- Provide constructive feedback
- Check for:
  - Code quality
  - Test coverage
  - Documentation
  - Performance impact
  - Security concerns

### 8. Release Process

1. Update version numbers
2. Update changelog
3. Create release notes
4. Tag release
5. Deploy to production

## Getting Help

- Check existing documentation
- Review open/closed issues
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license. 