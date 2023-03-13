# Contributing

**This is an early alpha. The implementation might change between versions
without warning. Please use at your own risk and pin to a specific version if
you're relying on this for anything important!**

## Development

Make sure you have a recent version of Node.js installed (`>=18`). Then run:

```
npm install
npm test
```

## Releases

To cut a new release, run:

```
cd replicate-js
git checkout main
git pull
npx np minor
```

This will:

- Run tests locally
- Bump the version in `package.json`
- Commit and tag the release
- Push the commit and tag to GitHub
- Publish the package to npm
- Create a GitHub release
