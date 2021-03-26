import axeCore from 'axe-core'
import AuditQueue from './AuditQueue.mjs'

// Apply default axeCore config
axeCore.configure({
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
})

export const axeCoreInstance = axeCore

// Axe core does not allow parallel audits in the same env. Hence a queue is shared
// across AxeObserver instances.
const SharedAuditQueue = new AuditQueue()

// The AxeObserver class takes a violationsCallback, which is invoked with an
// array of observed violations.
export default class AxeObserver {
  constructor(violationsCallback, auditQueueCallback) {
    if (typeof violationsCallback !== 'function') {
      throw new Error(
        'The AxeObserver constructor requires a violationsCallback'
      )
    }

    this._violationsCallback = violationsCallback

    this.observe = this.observe.bind(this)
    this.disconnect = this.disconnect.bind(this)

    this._alreadyReportedIncidents = new Set()
    this._mutationObserver = new window.MutationObserver(mutationRecords => {
      mutationRecords.forEach(mutationRecord => {
        this._auditNode(mutationRecord.target)
      })
    })
    
    if (auditQueueCallback) {
      auditQueueCallback(SharedAuditQueue)
    }
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
    this._auditNode(targetNode)
  }
  disconnect() {
    this._mutationObserver.disconnect()
    this._alreadyReportedIncidents.clear()
  }
  async _auditNode(node) {
    const response = await SharedAuditQueue.run(node, async () => {
      // Since audits are scheduled asynchronously, it can happen that
      // the node is no longer connected. We cannot analyze it then.
      return node.isConnected ? axeCore.run(node) : null
    })

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
