# Agnostic Axe

Agnostic axe logs accessibility issues to the browser console, as you develop your app. Its audits are powered by [axe-core](https://github.com/dequelabs/axe-core).

## Basic Usage

Install the module from NPM (`npm install --save-dev agnostic-axe`) or directly import it from the URL:

```js
import('https://unpkg.com/agnostic-axe@3').then(
  ({ AxeObserver, logViolations }) => {
    const MyAxeObserver = new AxeObserver(logViolations)
    MyAxeObserver.observe(document)
  }
)
```

> Be sure to only run the module in your development environment. Else your application will use more resources than necessary when in production. ([Webpack-Example](WEBPACK_EXAMPLE.MD))

## Advanced Configuration

The `AxeObserver` constructor takes two parameters:

- `violationsCallback` (required). A function that is invoked with an array of violations, as reported by [axe-core](https://github.com/dequelabs/axe-core). To log violations to the console, simply pass the `logViolations` function exported by this module.
- `options` (optional). An object with that supports the following configuration keys:
  - `axeCoreInstanceCallback` (optional, defaults to `AxeObserver.applyDefaultAxeCoreConfig). Function that is invoked with the [axe-core](https://github.com/dequelabs/axe-core) instance used by AxeObserver.

The `AxeObserver.observe` method takes one parameter:

- `targetNode` (required). AxeObserver performs an audit of this node, and continously monitors it for changes. If a change has been detected, AxeObserver audits the parts that have changed, and reports any new accessibility defects.

To observe multiple nodes, simply call the `AxeObserver.observe` method multiple times. There should never be more than one instance of AxeObserver running in the same enviroment.

```js
MyAxeObserver.observe(document.getElementById('react-main'))
MyAxeObserver.observe(document.getElementById('vue-header'))
MyAxeObserver.observe(document.getElementById('page-footer'))
```

To stop observing changes, call the `disconnect` method. Clears the cache of previously reported violations.

```js
MyAxeObserver.disconnect()
```

## Advantages

Unlike framework specific implementations of [axe-core](https://github.com/dequelabs/axe-core), such as [react-axe](https://github.com/dequelabs/react-axe), agnostic axe uses a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to listen for changes directly in the DOM. This has two advantages:

1. It always works with the newest version of your framework (and even if you switch technologies). For example, at the time of writing, [react-axe](https://github.com/dequelabs/react-axe) does not work with React function components or fragments, while agnostic axe does.
2. It only runs audits if the actual DOM changes. This means it uses less resources than [react-axe](https://github.com/dequelabs/react-axe), which runs audits when components rerender, even if their output does not change.

Agnostic axe is optimized for performance. Its audits are small chunks of work, that are run in the browser's idle periods.
