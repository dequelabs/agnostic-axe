import axeCore from 'axe-core'
import debounce from 'lodash.debounce'

// If requestIdleCallback is not supported, we fallback to setTimeout
// Ref: https://developers.google.com/web/updates/2015/08/using-requestidlecallback
const requestIdleCallback =
  window.requestIdleCallback ||
  function(callback) {
    setTimeout(callback, 1)
  }

// The AxeObserver class takes a violationsCallback, which is invoked with an
// array of observed violations.
export default class AxeObserver {
  constructor(
    violationsCallback,
    {
      axeCoreConfiguration = {
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
      },
      axeCoreInstanceCallback
    }
  ) {
    if (typeof violationsCallback !== 'function') {
      throw new Error(
        'The AxeObserver constructor requires a violationsCallback'
      )
    }

    this._violationsCallback = violationsCallback

    this.observe = this.observe.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this._auditTargetNode = this._auditTargetNode.bind(this)

    this._mutationObservers = []
    this._alreadyReportedIncidents = new Set()

    // Allow for registering plugins etc
    if (typeof axeInstanceCallback === 'function') {
      axeCoreInstanceCallback(axeCore)
    }

    // Configure axe
    axeCore.configure(axeCoreConfiguration)
  }
  observe(targetNode, { debounceMs = 1000, maxWaitMs = debounceMs * 5 }) {
    if (!targetNode) {
      throw new Error('AxeObserver.observe requires a targetNode')
    }

    const scheduleAudit = debounce(
      () => requestIdleCallback(() => this._auditTargetNode(targetNode)),
      debounceMs,
      { leading: true, maxWait: maxWaitMs }
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
    const response = await axeCore.run(targetNode)

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
      this._violationsCallback(violationsToReport)
    }
  }
}
