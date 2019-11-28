import axeCore from 'axe-core'
import PQueue from 'p-queue'

// If requestIdleCallback is not supported, we fallback to setTimeout
// Ref: https://developers.google.com/web/updates/2015/08/using-requestidlecallback
const requestIdleCallback =
  window.requestIdleCallback ||
  function(callback) {
    setTimeout(callback, 1)
  }

// axe-core cannot be run concurrently. There are no plans to implement this
// functionality or a queue. Hence we use PQueue to queue calls ourselves.
// Ref: https://github.com/storybookjs/storybook/pull/4086
const axeQueue = new PQueue({ concurrency: 1 })

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
    } = {}
  ) {
    if (typeof violationsCallback !== 'function') {
      throw new Error(
        'The AxeObserver constructor requires a violationsCallback'
      )
    }

    this._violationsCallback = violationsCallback

    this.observe = this.observe.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this._scheduleAudit = this._scheduleAudit.bind(this)

    this._alreadyReportedIncidents = new Set()
    this._mutationObserver = new window.MutationObserver(mutationRecords => {
      mutationRecords.forEach(mutationRecord => {
        this._scheduleAudit(mutationRecord.target)
      })
    })

    // Allow for registering plugins etc
    if (typeof axeInstanceCallback === 'function') {
      axeCoreInstanceCallback(axeCore)
    }

    // Configure axe
    axeCore.configure(axeCoreConfiguration)
  }
  observe(targetNode) {
    if (!targetNode) {
      throw new Error('AxeObserver.observe requires a targetNode')
    }

    this._mutationObserver.observe(targetNode, {
      attributes: true,
      subtree: true
    })

    // run initial audit on the whole targetNode
    this._scheduleAudit(targetNode)
  }
  disconnect() {
    this.mutationObserver.disconnect()
  }
  async _scheduleAudit(node) {
    const response = await axeQueue.add(
      () =>
        new Promise(resolve => {
          requestIdleCallback(
            () => {
              // Since audits are scheduled asynchronously, it can happen that
              // the node is no longer connected. We cannot analyze it then.
              node.isConnected ? axeCore.run(node).then(resolve) : resolve(null)
            },
            // Time after which an audit will be performed, even if it may
            // negatively affect performance.
            { timeout: 1000 }
          )
        })
    )

    if (!response) return

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
