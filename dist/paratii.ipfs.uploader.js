/* global File, ArrayBuffer */
'use strict';

/**
 * @module IPFS UPLOADER : Paratii IPFS uploader interface.
 */

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('events'),
    EventEmitter = _require.EventEmitter;

var joi = require('joi');
var pull = require('pull-stream');
var pullFilereader = require('pull-filereader');
var toPull = require('stream-to-pull-stream');
var fs = require('fs');
var path = require('path');

var _require2 = require('async'),
    eachSeries = _require2.eachSeries,
    nextTick = _require2.nextTick;

var once = require('once');
var Multiaddr = require('multiaddr');

// const ytdl = require('ytdl-core')
// const vidl = require('vimeo-downloader')
// const readline = require('readline')

var Uploader = function (_EventEmitter) {
  (0, _inherits3.default)(Uploader, _EventEmitter);

  function Uploader(paratiiIPFS, opts) {
    (0, _classCallCheck3.default)(this, Uploader);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Uploader.__proto__ || (0, _getPrototypeOf2.default)(Uploader)).call(this));

    _this.setOptions(opts);
    _this._ipfs = paratiiIPFS; // this is the paratii.ipfs.js
    // this._ipfs.log('========================browser-uploader=====================')
    return _this;
  }

  (0, _createClass3.default)(Uploader, [{
    key: 'setOptions',
    value: function setOptions() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      // if (!opts || !opts.node) {
      //   throw new Error('IPFS Instance is required By Uploader.')
      // }
      this._node = opts.node; // this is the actual IPFS node.
      this._chunkSize = opts.chunkSize || 100 * 1024;
      this._defaultTranscoder = opts.defaultTranscoder || '/dns4/bootstrap.paratii.video/tcp/443/wss/ipfs/QmeUmy6UtuEs91TH6bKnfuU1Yvp63CkZJWm624MjBEBazW'; // Address of transcoder '/ip4/127.0.0.1/tcp/4003/ws/ipfs/Qmbd5jx8YF1QLhvwfLbCTWXGyZLyEJHrPbtbpRESvYs4FS'
      // '/dns4/bootstrap.paratii.video/tcp/443/wss/ipfs/QmeUmy6UtuEs91TH6bKnfuU1Yvp63CkZJWm624MjBEBazW' // Address of transcoder
    }
  }, {
    key: 'onDrop',
    value: function onDrop(ev) {}

    /**
     * uploads a single file to *local* IPFS node
     * @param {File} file HTML5 File Object.
     * @returns {EventEmitter} checkout the upload function below for details.
     */

  }, {
    key: 'add',
    value: function add(file) {
      var files = void 0;
      if (Array.isArray(file)) {
        files = file;
      } else {
        files = [file];
      }

      var result = [];

      for (var i = 0; i < files.length; i++) {
        // check if File is actually available or not.
        // if not it means we're not in the browser land.
        if (typeof File !== 'undefined') {
          if (files[i] instanceof File) {
            result.push(this.html5FileToPull(files[i]));
          } else {
            result.push(this.fsFileToPull(files[i]));
          }
        } else {
          result.push(this.fsFileToPull(files[i]));
        }
      }

      return this.upload(result);
    }

    /**
     * returns a generic File Object with a Pull Stream from an HTML5 File
     * @param  {File} file HTML5 File Object
     * @return {Object}      generic file object.
     */

  }, {
    key: 'html5FileToPull',
    value: function html5FileToPull(file) {
      return {
        name: file.name,
        size: file.size,
        _pullStream: pullFilereader(file)
      };
    }

    /**
     * returns a generic file Object from a file path
     * @param  {String} filePath Path to file.
     * @return {Object}          generic file object.
     */

  }, {
    key: 'fsFileToPull',
    value: function fsFileToPull(filePath) {
      var stats = fs.statSync(filePath);
      if (stats) {
        return {
          name: path.basename(filePath),
          size: stats.size,
          _pullStream: toPull(fs.createReadStream(filePath))
        };
      } else {
        return null;
      }
    }

    /**
     * upload an Array of files as is to the local IPFS node
     * @param  {Array} files    HTML5 File Object Array.
     * @return {EventEmitter} returns EventEmitter with the following events:
     *    - 'start': uploader started.
     *    - 'progress': (chunkLength, progressPercent)
     *    - 'fileReady': (file) triggered when a file is uploaded.
     *    - 'done': (files) triggered when the uploader is done.
     *    - 'error': (err) triggered whenever an error occurs.
     */

  }, {
    key: 'upload',
    value: function upload(files) {
      var _this2 = this;

      var meta = {}; // holds File metadata.
      var ev = new EventEmitter();

      this._ipfs.start(function () {
        // trigger onStart callback
        ev.emit('start');

        pull(pull.values(files), pull.through(function (file) {
          _this2._ipfs.log('Adding ', file);
          meta.fileSize = file.size;
          meta.total = 0;
        }), pull.asyncMap(function (file, cb) {
          return pull(pull.values([{
            path: file.name,
            // content: pullFilereader(file)
            content: pull(file._pullStream, pull.through(function (chunk) {
              return ev.emit('progress', chunk.length, Math.floor((meta.total += chunk.length) * 1.0 / meta.fileSize * 100));
            }))
          }]), _this2._node.files.addPullStream({ chunkerOptions: { maxChunkSize: _this2._chunkSize } }), // default size 262144
          pull.collect(function (err, res) {
            if (err) {
              return ev.emit('error', err);
            }
            var file = res[0];
            _this2._ipfs.log('Adding %s finished as %s, size: %s', file.path, file.hash, file.size);
            ev.emit('fileReady', file);
            cb(null, file);
          }));
        }), pull.collect(function (err, files) {
          if (err) {
            ev.emit('error', err);
          }
          _this2._ipfs.log('uploader is DONE');
          ev.emit('done', files);
        }));
      });

      return ev;
    }

    /**
     * upload an entire directory to IPFS
     * @param  {String}   dirPath path to directory
     * @return {Promise}           returns the {hash, path, size} for the uploaded folder.
     */

  }, {
    key: 'addDirectory',
    value: function addDirectory(dirPath) {
      var _this3 = this;

      return new _promise2.default(function (resolve, reject) {
        // cb = once(cb)
        var resp = null;
        // this._ipfs.log('adding ', dirPath, ' to IPFS')

        var addStream = _this3._node.files.addReadableStream();
        addStream.on('data', function (file) {
          // this._ipfs.log('dirPath ', dirPath)
          // this._ipfs.log('file Added ', file)
          if (file.path === dirPath) {
            // this._ipfs.log('this is the hash to return ')
            resp = file;
            nextTick(function () {
              return resolve(resp);
            });
          }
        });

        addStream.on('end', function () {
          // this._ipfs.log('addStream ended')
          // nextTick(() => cb(null, resp))
        });

        fs.readdir(dirPath, function (err, files) {
          if (err) return reject(err);
          eachSeries(files, function (file, next) {
            next = once(next);
            try {
              _this3._ipfs.log('reading file ', file);
              var rStream = fs.createReadStream(path.join(dirPath, file));
              rStream.on('error', function (err) {
                if (err) {
                  _this3._ipfs.error('rStream Error ', err);
                  return next();
                }
              });
              if (rStream) {
                addStream.write({
                  path: path.join(dirPath, file),
                  content: rStream
                });
              }
            } catch (e) {
              if (e) {
                _this3._ipfs.error('createReadStream Error: ', e);
              }
            } finally {}
            // next()
            nextTick(function () {
              return next();
            });
          }, function (err) {
            if (err) return reject(err);
            // addStream.destroy()
            addStream.end();
          });
        });
      });
    }

    /**
     * signals transcoder(s) to transcode fileHash
     * @param  {String} fileHash IPFS file hash.
     * @param  {Object} options  ref: https://github.com/Paratii-Video/paratii-lib/blob/master/docs/paratii-ipfs.md#ipfsuploadertranscodefilehash-options
     * @return {EventEmitter} returns EventEmitter with the following events:
     *    - 'uploader:progress': (hash, chunkSize, percent) client to transcoder upload progress.
     *    - 'transcoding:started': (hash, author)
     *    - 'transcoding:progress': (hash, size, percent)
     *    - 'transcoding:downsample:ready' (hash, size)
     *    - 'transcoding:done': (hash, transcoderResult) triggered when the transcoder is done - returns the hash of the transcoded file
     *    - 'transcoder:error': (err) triggered whenever an error occurs.
     */

  }, {
    key: 'transcode',
    value: function transcode(fileHash, options) {
      var _this4 = this;

      var schema = joi.object({
        author: joi.string().default('0x'), // ETH/PTI address of the file owner
        transcoder: joi.string().default(this._defaultTranscoder),
        transcoderId: joi.any().default(Multiaddr(this._defaultTranscoder).getPeerId())
      }).unknown();

      this._ipfs.log('Signaling transcoder...');

      var result = joi.validate(options, schema);
      var error = result.error;
      if (error) throw error;
      var opts = result.value;

      var ev = void 0;
      if (opts.ev) {
        ev = opts.ev;
      } else {
        ev = new EventEmitter();
      }

      if (fileHash === '') {
        // empty hash for testing eventemitter
        ev.emit('transcoding:done', { test: 1 });
        return ev;
      }
      var msg = this._ipfs.protocol.createCommand('transcode', { hash: fileHash, author: opts.author, size: opts.size });
      // FIXME : This is for dev, so we just signal our transcoder node.
      // This needs to be dynamic later on.
      this._node.swarm.connect(opts.transcoder, function (err, success) {
        if (err) return ev.emit('transcoding:error', err);

        opts.transcoderId = opts.transcoderId || Multiaddr(opts.transcoder).getPeerId();
        _this4._ipfs.log('transcoderId: ', opts.transcoderId);
        _this4._node.swarm.peers(function (err, peers) {
          _this4._ipfs.log('peers: ', peers);
          if (err) return ev.emit('transcoding:error', err);
          peers.map(function (peer) {
            _this4._ipfs.log('peerID : ', peer.peer.id.toB58String(), opts.transcoderId, peer.peer.id.toB58String() === opts.transcoder);
            if (peer.peer.id.toB58String() === opts.transcoderId) {
              _this4._ipfs.log('sending transcode msg to ' + peer.peer.id.toB58String() + ' with request to transcode ' + fileHash);
              _this4._ipfs.protocol.network.sendMessage(peer.peer.id, msg, function (err) {
                if (err) {
                  ev.emit('transcoding:error', err);
                  return ev;
                }
              });
            }
          });

          // paratii transcoder signal.
          _this4._ipfs.on('protocol:incoming', _this4._transcoderRespHander(ev, fileHash));
          // ev.emit('transcoder:progress', 0) // TODO : add an event for starting.
        });
      });
      return ev;
    }

    /**
     * handles responses from the paratii-protocol in case of transcoding.
     * @param  {EventEmitter} ev the transcoding job EventEmitter
     * @return {function}    returns various events based on transcoder response.
     */

  }, {
    key: '_transcoderRespHander',
    value: function _transcoderRespHander(ev, fileHash) {
      var _this5 = this;

      return function (peerId, command) {
        _this5._ipfs.log('paratii protocol: Got Command ', command.payload.toString(), 'args: ', command.args.toString());
        var commandStr = command.payload.toString();
        var argsObj = void 0;
        try {
          argsObj = JSON.parse(command.args.toString());
        } catch (e) {
          _this5._ipfs.error('couldn\'t parse args, ', command.args.toString());
        }

        switch (commandStr) {
          case 'transcoding:error':
            console.log('DEBUG TRANSCODER ERROR: fileHash: ', fileHash, ' , errHash: ', argsObj.hash);
            if (argsObj.hash === fileHash) {
              ev.emit('transcoding:error', argsObj.err);
            }
            break;
          case 'transcoding:started':
            ev.emit('transcoding:started', argsObj.hash, argsObj.author);
            break;
          case 'transcoding:progress':
            ev.emit('transcoding:progress', argsObj.hash, argsObj.size, argsObj.percent);
            break;
          case 'uploader:progress':
            ev.emit('uploader:progress', argsObj.hash, argsObj.chunkSize, argsObj.percent);
            break;
          case 'transcoding:downsample:ready':
            ev.emit('transcoding:downsample:ready', argsObj.hash, argsObj.size);
            break;
          case 'transcoding:done':
            var result = JSON.parse(argsObj.result.toString());
            ev.emit('transcoding:done', argsObj.hash, result);
            break;
          default:
            _this5._ipfs.log('unknown command : ', commandStr);
        }
      };
    }

    /**
     * convenience method for adding and transcoding files
     * @param {Array} files Array of HTML5 File Objects
     */

  }, {
    key: 'addAndTranscode',
    value: function addAndTranscode(files) {
      var _this6 = this;

      var ev = this.add(files);
      // ev.on('done', this._signalTranscoder.bind(this))
      ev.on('done', function (files) {
        _this6._signalTranscoder(files, ev);
      });
      // return the EventEmitter
      return ev;
    }
  }, {
    key: '_signalTranscoder',
    value: function _signalTranscoder(files, ev) {
      var file = void 0;
      if (Array.isArray(files)) {
        if (files.length < 1) {
          // this._ipfs.log('_signalTranscoder Got an empty Array. files: ', files)
          // return
          //
          // FIXME THIS NEEDS TO BE REMOVED --------------------------------------
          file = { hash: '' // testing something ...
            // ---------------------------------------------------------------------
          };
        } else {
          file = files[0];
        }
      } else {
        file = files;
      }

      if (!ev) {
        ev = new EventEmitter();
      }

      this.transcode(file.hash, {
        author: '0x', // author address,
        // onDone: (err, folderHash) => {
        //   if (err) throw err
        //   this._ipfs.log('transcoder done ', folderHash)
        // },
        ev: ev
      });
    }
  }, {
    key: 'getMetaData',
    value: function getMetaData(fileHash, options) {
      var _this7 = this;

      return new _promise2.default(function (resolve, reject) {
        var schema = joi.object({
          transcoder: joi.string().default(_this7._defaultTranscoder),
          transcoderId: joi.any().default(Multiaddr(_this7._defaultTranscoder).getPeerId())
        }).unknown();

        _this7._ipfs.log('Signaling transcoder getMetaData...');
        var result = joi.validate(options, schema);
        var error = result.error;
        if (error) reject(error);
        var opts = result.value;
        console.log('opts: ', opts);
        var ev = void 0;
        if (opts.ev) {
          ev = opts.ev;
        } else {
          ev = new EventEmitter();
        }
        _this7._ipfs.start(function () {
          var msg = _this7._ipfs.protocol.createCommand('getMetaData', { hash: fileHash });
          // FIXME : This is for dev, so we just signal our transcoder node.
          // This needs to be dynamic later on.
          _this7._ipfs.ipfs.swarm.connect(opts.transcoder, function (err, success) {
            if (err) return reject(err);

            opts.transcoderId = opts.transcoderId || Multiaddr(opts.transcoder).getPeerId();
            _this7._ipfs.log('transcoderId: ', opts.transcoderId);
            _this7._node.swarm.peers(function (err, peers) {
              _this7._ipfs.log('peers: ', peers);
              if (err) return reject(err);

              peers.map(function (peer) {
                _this7._ipfs.log('peerID : ', peer.peer.id.toB58String(), opts.transcoderId, peer.peer.id.toB58String() === opts.transcoder);
                if (peer.peer.id.toB58String() === opts.transcoderId) {
                  _this7._ipfs.log('sending getMetaData msg to ' + peer.peer.id.toB58String() + ' with request to transcode ' + fileHash);
                  _this7._ipfs.protocol.network.sendMessage(peer.peer.id, msg, function (err) {
                    if (err) {
                      ev.emit('getMetaData:error', err);
                      return ev;
                    }
                  });
                }
              });

              // paratii getMetaData signal.
              _this7._ipfs.on('protocol:incoming', function (peerId, command) {
                _this7._ipfs.log('paratii protocol: Got Command ', command.payload.toString(), 'args: ', command.args.toString());
                var commandStr = command.payload.toString();
                var argsObj = void 0;
                try {
                  argsObj = JSON.parse(command.args.toString());
                } catch (e) {
                  _this7._ipfs.error('couldn\'t parse args, ', command.args.toString());
                }

                switch (commandStr) {
                  case 'getMetaData:error':
                    if (argsObj.hash === fileHash) {
                      console.log('DEBUG getMetaData ERROR: fileHash: ', fileHash, ' , errHash: ', argsObj.hash);
                      reject(argsObj.err);
                    }
                    break;
                  case 'getMetaData:done':
                    if (argsObj.hash === fileHash) {
                      console.log('data: ', argsObj.data);
                      var _result = argsObj.data;
                      resolve(_result);
                    }
                    break;
                  default:
                    _this7._ipfs.log('unknown command : ', commandStr);
                }
              });
              // ev.emit('transcoder:progress', 0) // TODO : add an event for starting.
            });
          });
        });
      });
    }
  }, {
    key: 'pinFile',
    value: function pinFile(fileHash, options) {
      var _this8 = this;

      if (options === undefined) options = {};

      var schema = joi.object({
        author: joi.string().default('0x'), // ETH/PTI address of the file owner
        transcoder: joi.string().default(this._defaultTranscoder),
        transcoderId: joi.any().default(Multiaddr(this._defaultTranscoder).getPeerId()),
        size: joi.number().default(0)
      }).unknown();

      this._ipfs.log('Signaling transcoder...');

      var result = joi.validate(options, schema);
      var error = result.error;
      if (error) throw error;
      var opts = result.value;

      var ev = void 0;
      if (opts.ev) {
        ev = opts.ev;
      } else {
        ev = new EventEmitter();
      }

      var msg = this._ipfs.protocol.createCommand('pin', { hash: fileHash, author: opts.author, size: opts.size });
      // FIXME : This is for dev, so we just signal our transcoder node.
      // This needs to be dynamic later on.
      this._node.swarm.connect(opts.transcoder, function (err, success) {
        if (err) return ev.emit('pin:error', err);

        _this8._node.swarm.peers(function (err, peers) {
          _this8._ipfs.log('peers: ', peers);
          if (err) return ev.emit('pin:error', err);
          peers.map(function (peer) {
            if (peer.peer.id.toB58String() === opts.transcoderId) {
              _this8._ipfs.log('sending pin msg to ' + peer.peer.id.toB58String() + ' with request to pin ' + fileHash);
              _this8._ipfs.protocol.network.sendMessage(peer.peer.id, msg, function (err) {
                if (err) {
                  ev.emit('pin:error', err);
                  return ev;
                }
              });
            }
          });

          // paratii pinning response.
          _this8._ipfs.on('protocol:incoming', _this8._pinResponseHandler(ev));
        });
      });

      return ev;
    }
  }, {
    key: '_pinResponseHandler',
    value: function _pinResponseHandler(ev) {
      var _this9 = this;

      return function (peerId, command) {
        _this9._ipfs.log('paratii protocol: Got Command ', command.payload.toString(), 'args: ', command.args.toString());
        var commandStr = command.payload.toString();
        var argsObj = void 0;
        try {
          argsObj = JSON.parse(command.args.toString());
        } catch (e) {
          _this9._ipfs.log('couldn\'t parse args, ', command.args.toString());
        }

        switch (commandStr) {
          case 'pin:error':
            ev.emit('pin:error', argsObj.err);
            break;
          case 'pin:progress':
            ev.emit('pin:progress', argsObj.hash, argsObj.chunkSize, argsObj.percent);
            break;
          case 'pin:done':
            ev.emit('pin:done', argsObj.hash);
            break;
          default:
            _this9._ipfs.log('unknown command : ', commandStr);
        }
      };
    }

    // grabYt (url, onResponse, callback) {
    //   let starttime
    //   let fileSize
    //   let video = ytdl(url)
    //   video.once('response', () => {
    //     this._ipfs.log(`starting ${url}`)
    //     starttime = Date.now()
    //     onResponse(null, starttime)
    //   })
    //
    //   video.on('error', (err) => {
    //     onResponse(err)
    //   })
    //
    //   video.on('progress', (chunkLength, downloaded, total) => {
    //     fileSize = total
    //     // const floatDownloaded = downloaded / total
    //     // const downloadedMinutes = (Date.now() - starttime) / 1000 / 60
    //     // readline.cursorTo(process.stdout, 0)
    //     // process.stdout.write(`${(floatDownloaded * 100).toFixed(2)}% downloaded`)
    //     // process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`)
    //     // process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`)
    //     // process.stdout.write(`, estimated time left: ${(downloadedMinutes / floatDownloaded - downloadedMinutes).toFixed(2)}minutes `)
    //     // readline.moveCursor(process.stdout, 0, -1)
    //   })
    //
    //   video.on('end', () => {
    //     process.stdout.write('\n\n')
    //     // cb(null, output)
    //   })
    //
    //   var total = 0
    //   function updateProgress (chunkLength) {
    //     total += chunkLength
    //     this._ipfs.log('Progress \t', total, ' / ', fileSize, ' = ', Math.floor((total / fileSize) * 100))
    //   }
    //
    //   pull(
    //     pull.values([{
    //       path: url,
    //       content: pull(
    //         toPull(video),
    //         pull.through((chunk) => updateProgress(chunk.length))
    //       )
    //     }]),
    //     this._node.files.addPullStream({chunkerOptions: {maxChunkSize: this._chunkSize}}), // default size 262144
    //     this._signalTranscoderPull(callback)
    //   )
    // }
    //
    // grabVimeo (url, onResponse, callback) {
    //   let starttime
    //   // let total = 0
    //   let video = vidl(url, {quality: '720p'})
    //
    //   video.once('response', () => {
    //     this._ipfs.log(`starting ${url}`)
    //     starttime = Date.now()
    //     onResponse(null, starttime)
    //   })
    //
    //   video.on('data', (chunk) => {
    //     // total += chunk.length / 1024 / 1024
    //   })
    //
    //   video.on('end', () => {
    //     // process.stdout.write('\n\n')
    //     // cb(null, output)
    //   })
    //
    //   function updateProgress (chunkLength) {
    //     // this._ipfs.log('Progress \t', total, ' / ', fileSize, ' = ', Math.floor((total / fileSize) * 100))
    //   }
    //
    //   pull(
    //     pull.values([{
    //       path: url,
    //       content: pull(
    //         toPull(video),
    //         pull.through((chunk) => updateProgress(chunk.length))
    //       )
    //     }]),
    //     this._node.files.addPullStream({chunkerOptions: {maxChunkSize: this._chunkSize}}), // default size 262144
    //     this._signalTranscoderPull(callback)
    //   )
    // }
    //
    // _signalTranscoderPull (callback) {
    //   return pull.collect((err, res) => {
    //     if (err) {
    //       return callback(err)
    //     }
    //     const file = res[0]
    //     this._ipfs.log('Adding %s finished', file.path)
    //
    //     // statusEl.innerHTML += `Added ${file.path} as ${file.hash} ` + '<br>'
    //     // Trigger paratii transcoder signal
    //     this.signalTrancoder(file, callback)
    //   })
    // }
    //
    // signalTranscoder (file, callback) {
    //   let msg = this._ipfs.protocol.createCommand('transcode', {hash: file.hash, author: this.id.id})
    //   this._node.swarm.connect('/dns4/bootstrap.paratii.video/tcp/443/wss/ipfs/QmeUmy6UtuEs91TH6bKnfuU1Yvp63CkZJWm624MjBEBazW', (err, success) => {
    //     if (err) throw err
    //     this._node.swarm.peers((err, peers) => {
    //       this._ipfs.log('peers: ', peers)
    //       if (err) throw err
    //       peers.map((peer) => {
    //         this._ipfs.log('sending transcode msg to ', peer.peer.id.toB58String())
    //         this._ipfs.protocol.network.sendMessage(peer.peer.id, msg, (err) => {
    //           if (err) console.warn('[Paratii-protocol] Error ', err)
    //         })
    //
    //         if (peer.addr) {
    //         }
    //       })
    //       callback(null, file)
    //     })
    //   })
    //     // paratii transcoder signal.
    //   this._ipfs.protocol.notifications.on('command', (peerId, command) => {
    //     this._ipfs.log('paratii protocol: Got Command ', command)
    //     if (command.payload.toString() === 'transcoding:done') {
    //       let args = JSON.parse(command.args.toString())
    //       let result = JSON.parse(args.result)
    //       this._ipfs.log('args: ', args)
    //       this._ipfs.log('result: ', result)
    //         // statusEl.innerHTML += `Video HLS link: /ipfs/${result.master.hash}\n`
    //
    //         // titleEl = document.querySelector('#input-title')
    //         // this._ipfs.log('titleEl: ', titleEl)
    //       //   Meteor.call('videos.create', {
    //       //     id: String(Math.random()).split('.')[1],
    //       //     title: titleEl.value,
    //       //     price: 0.0,
    //       //     src: '/ipfs/' + result.master.hash,
    //       //     mimetype: 'video/mp4',
    //       //     stats: {
    //       //       likes: 0,
    //       //       dislikes: 0
    //       //     }}, (err, videoId) => {
    //       //       if (err) throw err
    //       //       this._ipfs.log('[upload] Video Uploaded: ', videoId)
    //       //       statusEl.innerHTML += '\n Video Uploaded go to <b><a href="/play/' + videoId + '">/play/' + videoId + '</a></b>\n'
    //       //     })
    //     }
    //   })
    // }

  }]);
  return Uploader;
}(EventEmitter);

module.exports = Uploader;