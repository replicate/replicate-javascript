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

## Vendored Dependencies

We have a few dependencies that have been bundled into the vendor directory rather than adding external npm dependencies.

These have been generated using bundlejs.com and copied into the appropriate directory along with the license and repository information.

* [eventsource-parser/stream](https://bundlejs.com/?bundle&q=eventsource-parser%40latest%2Fstream&config=%7B%22esbuild%22%3A%7B%22format%22%3A%22cjs%22%2C%22minify%22%3Afalse%2C%22platform%22%3A%22neutral%22%7D%7D)
* [streams-text-encoding/text-decoder-stream](https://bundlejs.com/?q=%40stardazed%2Fstreams-text-encoding&treeshake=%5B%7B+TextDecoderStream+%7D%5D&config=%7B%22esbuild%22%3A%7B%22format%22%3A%22cjs%22%2C%22minify%22%3Afalse%7D%7D)

> [!NOTE]
> The vendored implementation of `TextDecoderStream` requires
> the following patch to be applied to the output of bundlejs.com:
>
> ```diff
>   constructor(label, options) {
> -   this[decDecoder] = new TextDecoder(label, options);
> -   this[decTransform] = new TransformStream(new TextDecodeTransformer(this[decDecoder]));
> +   const decoder = new TextDecoder(label || "utf-8", options || {});
> +   this[decDecoder] = decoder;
> +   this[decTransform] = new TransformStream(new TextDecodeTransformer(decoder));
>   }
> ```
