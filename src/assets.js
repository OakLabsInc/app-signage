const tools = require('oak-tools')
const Api = tools.api

let ref = false

let filesync = new Api('https://localhost/filesync', function (err, api) {
  if (err) throw err
  console.log('filesync api:', api)
  ref = api
})

function getState (cb) {
  filesync.then(api => {
    ref.get.state()
      .then(state => cb(null, state.obj))
      .catch(err => cb(err))      
  })
}


function wait (cb) {
  filesync.then(api => {
    ref.get.wait()
      .then(state => {
        console.log(state)
        cb(null, state)
      })
      .catch(err => cb(err))
  })
}

module.exports.state = (cb = function () {}) => getState(cb)
module.exports.wait = (cb = function () {}) => wait(cb)
