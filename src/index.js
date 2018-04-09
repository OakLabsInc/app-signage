process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const oak = require('oak')

oak.catchErrors()

const _ = require('lodash')
const { join } = require('path')
const request = require('request')
const fs = require('fs')
const nconf = require('nconf')
const tools = require('oak-tools')
const Api = tools.api

const config = nconf
  .env()
  .file({
    file: '/data/settings.json'
  })

const remoteSettings = join(process.env.SETTINGS_FILE || 'assets/settings.json')

let fetchSettings = function (cb = () => {}) {
  request.get(`https://localhost/${remoteSettings}`, (err, res, body) => {
    if (_.get(res, 'statusCode') === 200) {
      fs.writeFile('/data/settings.json', body, function () {
        nconf.file({
          file: '/data/settings.json'
        })
      })
      cb(body)
    } else {
      setTimeout(fetchSettings, 5000)
    }
  })
}

fetchSettings()

oak.on('ready', () => {
  let window = oak.load(
    // assign whatever is in the settings.json as values to oak.load, which usually will at least have `url`
    _.assign(
      {
        url: 'http://static.oak.host/signage',
        sslExceptions: ['localhost'],
        insecure: true
      },
      config.get('app')
    )
  )
})
