var airswarm = require('airswarm')

var sw = airswarm('testing', function (sock) {
  sock.write('hello world (' + process.pid + ')\n')
  sock.pipe(process.stdout)
})