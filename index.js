var multicastdns = require('multicast-dns')
var net = require('net')
var addr = require('network-address')

module.exports = function airswarm (name, opts, fn) {
  if (typeof opts === 'function') return airswarm(name, null, opts)
  if (!opts) opts = {}

  var limit = opts.limit || Infinity
  var delay = opts.delay || 3000
  var mdns = multicastdns()
  var connections = {}

  var server = net.createServer(function (sock) {
    sock.on('error', function (err) {
      sock.destroy(err)
    })
    track(sock)
  })

  server.peers = []

  function track (sock) {
    if (server.peers.length >= limit) return sock.destroy()
    server.peers.push(sock)
    sock.on('close', function () {
      server.peers.splice(server.peers.indexOf(sock), 1)
    })
    server.emit('peer', sock)
  }

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
    var interval = setInterval(update, delay)

    server.on('close', function () {
      clearInterval(interval)
      mdns.destroy()
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
      if (server.peers.length < limit) mdns.query([{name: name, type: 'SRV'}])
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

      track(sock)
    }
  })

  if (fn) server.on('peer', fn)
  server.listen(0)

  return server
}
