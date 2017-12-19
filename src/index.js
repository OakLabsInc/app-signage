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

let fetchSettings = function (cb = () => {}) {
  request.get('https://localhost/assets/settings.json', (err, res, body) => {
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
  let window = oak.load({
    url: config.get('app:url') || 'http://static.oak.host/signage',
    sslExceptions: ['localhost'],
    scripts: [
      // {
      //   name: 'assets',
      //   path: join(__dirname, 'assets')
      // }
    ]
  })
})
