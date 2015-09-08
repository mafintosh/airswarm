# airswarm

Network swarm that automagically discovers other peers on the network using multicast dns

```
npm install airswarm
```

[![build status](http://img.shields.io/travis/mafintosh/airswarm.svg?style=flat)](http://travis-ci.org/mafintosh/airswarm)

## Usage

``` js
var airswarm = require('airswarm')

airswarm('testing', function (sock) {
  sock.write('hello world (' + process.pid + ')\n')
  sock.pipe(process.stdout)
})
```

If you run the above program in a couple of processes on the same local network
the swarms should start connecting to each other and write hello world

## API

#### `swarm = airswarm(name, [onpeer])`

Create a new swarm. The `swarm` will emit `peer` everytime a new peer
is connected. Optionally you can pass a `peer` listener as the second argument.

The `peer` will be a tcp stream to another swarm.

## License

MIT
