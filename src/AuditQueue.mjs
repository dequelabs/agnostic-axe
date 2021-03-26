import { rIC as requestIdleCallback } from 'idlize/idle-callback-polyfills.mjs'

export default class AuditQueue {
  constructor() {
    this._pendingAudits = new Map()
    this._isRunning = false

    this.run = this.run.bind(this)
    this._scheduleAudits = this._scheduleAudits.bind(this)
  }
  run(node, getAuditResult) {
    if (this._pendingAudits.has(node)) {
      // This node is already scheduled to be audited.
      return null
    }

    // Returns a promise that resolves when this node is audited.
    return new Promise((resolve, reject) => {
      const runAudit = async () => {
        try {
          const result = await getAuditResult()
          resolve(await result)
        } catch (error) {
          reject(error)
        }
      }

      this._pendingAudits.set(node, runAudit)
      if (!this._isRunning) this._scheduleAudits()
    })
  }
  _scheduleAudits() {
    this._isRunning = true
    requestIdleCallback(async IdleDeadline => {
      const iterator = this._pendingAudits.entries()

      for (const [node, runAudit] of iterator) {
        // Only run one audit at a time, as axe-core does not allow for
        // concurrent runs.
        // Ref: https://github.com/dequelabs/axe-core/issues/1041
        await runAudit()
        this._pendingAudits.delete(node)

        if (IdleDeadline.timeRemaining() === 0) {
          break
        }
      }

      if (this._pendingAudits.size > 0) {
        // If pending audits remain, schedule them for the next idle phase.
        this._scheduleAudits()
      } else {
        // The queue is empty, we're no longer running
        this._isRunning = false
      }
    })
  }
  get isRunning() {
    return this._isRunning
  }
}
