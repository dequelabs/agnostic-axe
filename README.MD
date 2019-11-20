# Agnostic Axe

Test your web application with the [axe-core](https://github.com/dequelabs/axe-core) accessibility testing library. Results will show in the browser console.

## Installation

You can install the module from NPM.

```sh
npm install --save-dev agnostic-axe
```

## Usage

```js
if (process.env.NODE_ENV !== 'production') {
  import('agnostic-axe').then(AxeReporter => {
    const MyAxeReporter = new AxeReporter()
    MyAxeReporter.observe(document)
  })
}
```

Be sure to only run the module in your development environment (as shown in the code above) or else your application will use more resources than necessary when in production.

Once the `observe` method has been invoked, `MyAxeReporter` starts reporting accessibility defects to the browser console. It continously observes the passed node for changes. If a change has been detected, it will reanalyze the node and report any new accessibility defects.

To stop observing changes, one can call the `disconnect` method.

### Configuration

The `AxeReporter` `observe` method takes three parameters:

- `targetNode` (required). The node that should be observed & analyzed.
- `debounceMs` (optional, defaults to `1000`). The number of milliseconds to wait for component updates to cease before performing an analysis of all the changes.
- `axeOptions` (optional, defaults to `{}`). It is a configuration object for [axe-core](https://github.com/dequelabs/axe-core). Read about the object at https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeOptionsure. Note that `agnostic-axe` always runs [axe-core](https://github.com/dequelabs/axe-core) with the `reporter: 'v2'` option.

## Credits

Agnostic axe itself is merely a wrapper around [axe-core](https://github.com/dequelabs/axe-core) that employs a `MutationObserver` to detect DOM changes automatically. Most of its logic for formatting violations return by [axe-core](https://github.com/dequelabs/axe-core) is taken from [react-axe](https://github.com/dequelabs/react-axe).
