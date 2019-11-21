import axe from 'axe-core'

// If requestIdleCallback is not supported, we fallback to setTimeout
// Ref: https://developers.google.com/web/updates/2015/08/using-requestidlecallback
const requestIdleCallback =
  window.requestIdleCallback ||
  function(callback) {
    setTimeout(callback, 1)
  }

// Define own debounce function to avoid excess dependencies
// Ref: https://chrisboakes.com/how-a-javascript-debounce-function-works/
function debounce(callback, wait) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => callback.apply(this, args), wait)
  }
}

class AxeReporter {
  constructor(
    axeConfiguration = {
      reporter: 'v2',
      checks: [
        {
          id: 'color-contrast',
          options: {
            // Prevent axe from automatically scrolling
            noScroll: true
          }
        }
      ]
    }
  ) {
    this.observe = this.observe.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this._auditTargetNode = this._auditTargetNode.bind(this)

    this._mutationObservers = []
    this._alreadyReportedIncidents = new Set()

    axe.configure(axeConfiguration)
  }
  observe(targetNode, debounceMs = 1000) {
    if (!targetNode) {
      throw new Error('AxeReporter.observe requires a targetNode')
    }

    const scheduleAudit = debounce(
      () => requestIdleCallback(() => this._auditTargetNode(targetNode)),
      debounceMs
    )
    const mutationObserver = new window.MutationObserver(scheduleAudit)

    // observe changes
    mutationObserver.observe(targetNode, {
      attributes: true,
      subtree: true
    })

    this._mutationObservers.push(mutationObserver)

    // run initial audit
    scheduleAudit(targetNode)
  }
  disconnect() {
    this._mutationObservers.forEach(mutationObserver => {
      mutationObserver.disconnect()
    })
  }
  async _auditTargetNode(targetNode) {
    const response = await axe.run(targetNode)

    const violationsToReport = response.violations.filter(violation => {
      const filteredNodes = violation.nodes.filter(node => {
        const key = node.target.toString() + violation.id

        const wasAlreadyReported = this._alreadyReportedIncidents.has(key)

        if (wasAlreadyReported) {
          // filter out this violation for this node
          return false
        } else {
          // add to alreadyReportedIncidents as we'll report it now
          this._alreadyReportedIncidents.add(key)
          return true
        }
      })

      return filteredNodes.length > 0
    })

    const hasViolationsToReport = violationsToReport.length > 0

    if (hasViolationsToReport) {
      AxeReporter.reportViolations(violationsToReport)
    }
  }
  static REPORT_STYLES = {
    critical: 'color:red; font-weight:bold;',
    serious: 'color:red; font-weight:normal;',
    moderate: 'color:orange; font-weight:bold;',
    minor: 'color:orange; font-weight:normal;',
    elementLog: 'font-weight:bold; font-family:Courier;',
    defaultReset: 'font-color:black; font-weight:normal;'
  }
  static reportViolations(violations) {
    console.group('%cNew aXe issues', AxeReporter.REPORT_STYLES.serious)
    violations.forEach(violation => {
      const format =
        AxeReporter.REPORT_STYLES[violation.impact] ||
        AxeReporter.REPORT_STYLES.minor
      console.groupCollapsed(
        '%c%s: %c%s %s',
        format,
        violation.impact,
        AxeReporter.REPORT_STYLES.defaultReset,
        violation.help,
        violation.helpUrl
      )
      console.groupEnd()
      violation.nodes.forEach(node => {
        AxeReporter.reportFailureSummary(node, 'any')
        AxeReporter.reportFailureSummary(node, 'none')
      })
    })
    console.groupEnd()
  }
  static reportFailureSummary(node, key) {
    // This method based off react-axe's failureSummary
    // Ref: https://github.com/dequelabs/react-axe
    function logElement(node, logFn) {
      const elementInDocument = document.querySelector(node.target.toString())
      if (!elementInDocument) {
        logFn(
          'Selector: %c%s',
          AxeReporter.REPORT_STYLES.elementLog,
          node.target.toString()
        )
      } else {
        logFn('Element: %o', elementInDocument)
      }
    }

    function logHtml(node) {
      console.log('HTML: %c%s', AxeReporter.REPORT_STYLES.elementLog, node.html)
    }

    function logFailureMessage(node, key) {
      const message = axe._audit.data.failureSummaries[key].failureMessage(
        node[key].map(check => check.message || '')
      )

      console.error(message)
    }

    if (node[key].length > 0) {
      logElement(node, console.groupCollapsed)
      logHtml(node)
      logFailureMessage(node, key)

      const relatedNodes = node[key].reduce(
        (accumulator, check) => [...accumulator, ...check.relatedNodes],
        []
      )

      if (relatedNodes.length > 0) {
        console.groupCollapsed('Related nodes')
        relatedNodes.forEach(relatedNode => {
          logElement(relatedNode, console.log)
          logHtml(relatedNode)
        })
        console.groupEnd()
      }

      console.groupEnd()
    }
  }
}

export default AxeReporter
