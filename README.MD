# Agnostic Axe

Test your web application with the [axe-core](https://github.com/dequelabs/axe-core) accessibility testing library. Results will show in the browser console.

## Installation

You can install the module from NPM via (`npm install --save-dev agnostic-axe`) or directly import it from the URL, as shown below:

## Usage

```js
import('https://unpkg.com/agnostic-axe@2').then(
  ({ AxeObserver, logViolations }) => {
    const MyAxeObserver = new AxeObserver(logViolations)
    MyAxeObserver.observe(document)
  }
)
```

> Be sure to only run the module in your development environment. Else your application will use more resources than necessary when in production.

In the example above, once the `observe` method has been invoked, `MyAxeObserver` audits the passed node and reports any accessibility defects to the browser console. It continously observes the passed node for changes. If a change has been detected, it will audit the parts of the nodes that have changed, and report any new accessibility defects.

To observe multiple nodes, one can call the `observe` method multiple times.

> Note that due to a [limitation of axe-core](https://github.com/dequelabs/axe-core/pull/1914), there should never be more than one instance of AxeObserver running in the same enviroment.

```js
MyAxeObserver.observe(root1)
MyAxeObserver.observe(root2)
MyAxeObserver.observe(root3)
```

To stop observing changes, one can call the `disconnect` method.

```js
MyAxeObserver.disconnect()
```

### Configuration

The `AxeObserver` constructor takes two parameters:

- `violationsCallback` (required). A function that is invoked with an array of violations, as reported by [axe-core](https://github.com/dequelabs/axe-core). To log violations to the console, simply pass the `logViolations` function exported by this module.
- `options` (optional). An object with that supports the following configuration keys:
  - `axeCoreConfiguration` (optional). A configuration object for axe-core. Read about the object here in the [axe-core docs](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure) and see the `agnostic-axe` source code for the default options used.
  - `axeCoreInstanceCallback` (optional). A function that is invoked with the instance of [axe-core](https://github.com/dequelabs/axe-core) used by module. It can be used for complex interactions with the [axe-core API](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md) such as registering plugins.

The `AxeObserver.observe` method takes one parameter:

- `targetNode` (required). The node that should be observed & analyzed.

## Credits

Agnostic axe itself is merely a wrapper around [axe-core](https://github.com/dequelabs/axe-core) that employs a `MutationObserver` to detect DOM changes automatically. Most of its logic for formatting violations return by [axe-core](https://github.com/dequelabs/axe-core) is taken from [react-axe](https://github.com/dequelabs/react-axe).
