# Agnostic Axe

Test your web application with the [axe-core](https://github.com/dequelabs/axe-core) accessibility testing library. Results will show in the browser console.

## Installation

You can install the module from NPM.

```sh
npm install --save-dev agnostic-axe
```

## Usage

```js
import('agnostic-axe').then(({ AxeObserver, logViolations }) => {
  const MyAxeObserver = new AxeObserver(logViolations)
  MyAxeObserver.observe(document)
})
```

> Be sure to only run the module in your development environment. Else your application will use more resources than necessary when in production.

In the example above, once the `observe` method has been invoked, `MyAxeObserver` starts reporting accessibility defects to the browser console. It continously observes the passed node for changes. If a change has been detected, it will reanalyze the node and report any new accessibility defects.

To stop observing changes, one can call the `disconnect` method.

```js
MyAxeObserver.disconnect()
```

### Configuration

The `AxeObserver` constructor takes two parameters:

- `violationsCallback` (required). A function that is invoked with an array of violations, as reported by [axe-core](https://github.com/dequelabs/axe-core). To log violations to the console, simply pass the `logViolations` function exported by this module.
- `axeConfiguration` (optional). A function that is invoked with the instance of [axe-core](https://github.com/dequelabs/axe-core) used by module. It can be used to [configure axe-core](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure). See the source code for the default configuration used.

The `AxeObserver.observe` method takes two parameters:

- `targetNode` (required). The node that should be observed & analyzed.
- `debounceMs` (optional, defaults to `1000`). The number of milliseconds that updates should cease before an analysis is performed.
- `maxWaitMs` (optional, defaults to `debounceMs * 5`). Number of milliseconds after which an analysis will be performed, even if the targetNode is still updating.

## Credits

Agnostic axe itself is merely a wrapper around [axe-core](https://github.com/dequelabs/axe-core) that employs a `MutationObserver` to detect DOM changes automatically. Most of its logic for formatting violations return by [axe-core](https://github.com/dequelabs/axe-core) is taken from [react-axe](https://github.com/dequelabs/react-axe).
