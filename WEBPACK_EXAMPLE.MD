# Webpack Example

```js
if (process.env.NODE_ENV !== 'production') {
  // Import agnostic axe here.
  // Webpack will comment out this code in production.
  import('https://unpkg.com/agnostic-axe@3').then(
    ({ AxeObserver, logViolations }) => {
      const MyAxeObserver = new AxeObserver(logViolations)
      MyAxeObserver.observe(document)
    }
  )
}
```
