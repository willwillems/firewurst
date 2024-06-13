/**
 * A promise wrapped in another object to add some functionallity
 * 
 * @property {function} resolve
 * @property {function} reject
 * @property {boolean} done
 */
export function Deferred() {
  var self = this
  this.promise = new Promise(function(resolve, reject) {
    self.done = false

    self.reject  = (...a) => (self.done = true, reject(...a))
    self.resolve = (...a) => (self.done = true, resolve(...a))
  })
}
