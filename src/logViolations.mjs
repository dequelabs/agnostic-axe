import { axeCoreInstance } from './AxeObserver'

const boldCourier = 'font-weight:bold;font-family:Courier;'
const critical = 'color:red;font-weight:bold;'
const serious = 'color:red;font-weight:normal;'
const moderate = 'color:orange;font-weight:bold;'
const minor = 'color:orange;font-weight:normal;'
const defaultReset = 'font-color:black;font-weight:normal;'

// The logViolations function takes an array of violations and logs them to the
// console in a nice format. Its code is copied from the `react-axe` module.
// Ref: https://github.com/dequelabs/react-axe
export default function logViolations(violations) {
  if (violations.length) {
    console.group('%cNew aXe issues', serious)
    violations.forEach(function(result) {
      var fmt
      switch (result.impact) {
        case 'critical':
          fmt = critical
          break
        case 'serious':
          fmt = serious
          break
        case 'moderate':
          fmt = moderate
          break
        case 'minor':
          fmt = minor
          break
        default:
          fmt = minor
          break
      }
      console.groupCollapsed(
        '%c%s: %c%s %s',
        fmt,
        result.impact,
        defaultReset,
        result.help,
        result.helpUrl
      )
      result.nodes.forEach(function(node) {
        failureSummary(node, 'any')
        failureSummary(node, 'none')
      })
      console.groupEnd()
    })
    console.groupEnd()
  }
}

function logElement(node, logFn) {
  var el = document.querySelector(node.target.toString())
  if (!el) {
    logFn('Selector: %c%s', boldCourier, node.target.toString())
  } else {
    logFn('Element: %o', el)
  }
}

function logHtml(node) {
  console.log('HTML: %c%s', boldCourier, node.html)
}

function logFailureMessage(node, key) {
  var message = axeCoreInstance._audit.data.failureSummaries[
    key
  ].failureMessage(
    node[key].map(function(check) {
      return check.message || ''
    })
  )

  console.error(message)
}

function failureSummary(node, key) {
  if (node[key].length > 0) {
    logElement(node, console.groupCollapsed)
    logHtml(node)
    logFailureMessage(node, key)

    var relatedNodes = []
    node[key].forEach(function(check) {
      relatedNodes = relatedNodes.concat(check.relatedNodes)
    })

    if (relatedNodes.length > 0) {
      console.groupCollapsed('Related nodes')
      relatedNodes.forEach(function(relatedNode) {
        logElement(relatedNode, console.log)
        logHtml(relatedNode)
      })
      console.groupEnd()
    }

    console.groupEnd()
  }
}
