var multicastdns = require('multicast-dns')
var net = require('net')
var addr = require('network-address')

module.exports = function airswarm (name, fn) {
  var mdns = multicastdns()
  var connections = {}

  var server = net.createServer(function (sock) {
    server.emit('peer', sock)
  })

  server.on('listening', function () {
    var host = addr()
    var port = server.address().port
    var id = host + ':' + port

    mdns.on('query', function (q) {
      for (var i = 0; i < q.questions.length; i++) {
        var qs = q.questions[i]
        if (qs.name === name && qs.type === 'SRV') return respond()
      }
    })

    mdns.on('response', function (r) {
      for (var i = 0; i < r.answers.length; i++) {
        var a = r.answers[i]
        if (a.name === name && a.type === 'SRV') connect(a.data.target, a.data.port)
      }
    })

    update()
    var interval = setInterval(update, 3000)

    server.on('close', function () {
      clearInterval(interval)
    })

    function respond () {
      mdns.response([{
        name: name,
        type: 'SRV',
        data: {
          port: port,
          weigth: 0,
          priority: 10,
          target: host
        }
      }])
    }

    function update () {
      mdns.query([{name: name, type: 'SRV'}])
    }

    function connect (host, port) {
      var remoteId = host + ':' + port
      if (remoteId === id) return
      if (connections[remoteId]) return
      if (remoteId < id) return respond()

      var sock = connections[remoteId] = net.connect(port, host)

      sock.on('error', function () {
        sock.destroy()
      })

      sock.on('close', function () {
        delete connections[remoteId]
      })

      server.emit('peer', sock)
    }
  })

  if (fn) server.on('peer', fn)
  server.listen(0)

  return server
}