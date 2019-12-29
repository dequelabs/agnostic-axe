import Jasmine from 'jasmine'
import JasmineConsoleReporter from 'jasmine-console-reporter'
import * as AgnosticAxe from '../src/index.mjs'

const jasmine = new Jasmine()

jasmine.env.clearReporters()
jasmine.addReporter(
  new JasmineConsoleReporter({
    colors: true,
    cleanStack: true,
    verbosity: 4,
    listStyle: 'indent',
    activity: false
  })
)

jasmine.env.describe('The AgnosticAxe module', () => {
  jasmine.env.it('should export a `logViolations` function', () => {
    expect(typeof AgnosticAxe.logViolations).toBe('function')
  })

  jasmine.env.it('should export a `AxeObserver` constructor', () => {
    expect(typeof AgnosticAxe.AxeObserver).toBe('function')
  })
})

jasmine.execute()
