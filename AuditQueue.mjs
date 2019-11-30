import { rIC as requestIdleCallback } from 'idlize/idle-callback-polyfills.mjs'

export default class AuditQueue {
  constructor() {
    this._pendingAudits = []
    this._isRunning = false

    this.run = this.run.bind(this)
    this._scheduleAudits = this._scheduleAudits.bind(this)
  }
  run(getAuditResult) {
    // Returns a promise that resolves to the result of the auditCallback.
    return new Promise((resolve, reject) => {
      const runAudit = async () => {
        try {
          const result = await getAuditResult()
          resolve(await result)
        } catch (error) {
          reject(error)
        }
      }

      this._pendingAudits.push(runAudit)
      if (!this._isRunning) this._scheduleAudits()
    })
  }
  _scheduleAudits() {
    this._isRunning = true
    requestIdleCallback(async IdleDeadline => {
      // Run pending audits as long as they exist & we have time.
      while (
        this._pendingAudits.length > 0 &&
        IdleDeadline.timeRemaining() > 0
      ) {
        // Only run one audit at a time, as axe-core does not allow for
        // concurrent runs.
        // Ref: https://github.com/dequelabs/axe-core/issues/1041
        const runAudit = this._pendingAudits[0]
        await runAudit()

        // Once an audit has run, remove it from the queue.
        this._pendingAudits.shift()
      }

      if (this._pendingAudits.length > 0) {
        // If pending audits remain, schedule them for the next idle phase.
        this._scheduleAudits()
      } else {
        // The queue is empty, we're no longer running
        this._isRunning = false
      }
    })
  }
}
