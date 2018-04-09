const joi = require('joi')

/**
  * @typedef {Array} accountSchema
  * @property {?string} address public address of the account
  * @property {?string} privateKey private key of the account
  * @property {?string} mnemonic mnemonic that generates private key and address
 */
const accountSchema = joi.object({
  address: joi.string().default(null).allow(null),
  privateKey: joi.string().default(null).allow(null),
  mnemonic: joi.string().default(null).allow(null)
}).default()

/**
  * @typedef {Array} ethSchema
  * @property {?string} provider provider of the parity node
  * @property {?string} registryAddress address of the TCR
  * @property {?boolean} isTestNet true if it's on test net, false otherwise
 */
const ethSchema = joi.object({
  provider: joi.string().default('ws://localhost:8546'),
  registryAddress: joi.string().default(null).allow(null),
  isTestNet: joi.boolean().optional()
}).default()

/**
  * @typedef {Array} ipfsSchema
  * @property {?string} repo path to the ipfs repo
  * @property {Array} swarm available transports for ipfs (webrtc, websocket, ...)
  * @property {Array} bootstrap bootstrap nodes that ipfs connects to when it starts
  * @property {?number} bitswap.maxMessageSize the maximum msg size allowed for paratii-ipfs-bitswap
  * @property {?number} chunkSize max size allowed per file chunk
  * @property {?number} xhrChunkSize max chunk size for the express uploader
  * @property {?number} maxFileSize max size for an original video (default to 300MB)
  * @property {?string} defaultTranscoder the default multiaddress of the main paratii-node
  * @property {?string} transcoderDropUrl url for the express uploader
 */
const ipfsSchema = joi.object({
  repo: joi.string().default(null).allow(null),
  // passed to IPFS constructor as `config.Addresses.Swarm`
  swarm: joi
    .array()
    .ordered(
        joi.string().default('/dns4/star.paratii.video/tcp/443/wss/p2p-webrtc-star'),
        joi.string().default('/dns/ws.star.paratii.video/wss/p2p-websocket-star/')
    ),
  bootstrap: joi
    .array()
    .ordered(
        joi.string().default('/dns4/bootstrap.paratii.video/tcp/443/wss/ipfs/QmeUmy6UtuEs91TH6bKnfuU1Yvp63CkZJWm624MjBEBazW')
    ),
  'bitswap.maxMessageSize': joi.number().default(256 * 1024),
  chunkSize: joi.number().default(128 * 1024),
  xhrChunkSize: joi.number().default(1 * 1024 * 1024),
  maxFileSize: joi.number().default(300 * 1024 * 1024),
  defaultTranscoder: joi.string().default('/dns4/bootstrap.paratii.video/tcp/443/wss/ipfs/QmeUmy6UtuEs91TH6bKnfuU1Yvp63CkZJWm624MjBEBazW'),
  transcoderDropUrl: joi.string().default('https://uploader.paratii.video/api/v1/transcode')

}).default()

/**
  * @typedef {Array} dbSchema
  * @property {?string} provider provider of the db
 */
const dbSchema = joi.object({
  provider: joi.string().default('https://db.paratii.video/api/v1/')
}).default()

 /**
  * @typedef {Array} videoSchema
  * @property {?string} id univocal video identifier randomly generated
  * @property {?string} author author of the video
  * @property {?string} description description of the video
  * @property {?string} duration duration of the video
  * @property {?string} filename filename of the video
  * @property {number} filesize size of the video
  * @property {?string} free ?
  * @property {?string} ipfsHashOrig original ipfs multihash of the video
  * @property {?string} ipfsHash ipfs multihash of the video
  * @property {string} owner owner of the video
  * @property {?number} price price of the video
  * @property {?string} title title of the video
  * @property {Array} thumbnails thumbnails of the video
  * @property {?Object} storageStatus ?
  * @property {string} storageStatus.name ?
  * @property {?Object} storageStatus.data ?
  * @property {?Object} transcodingStatus ?
  * @property {string} transcodingStatus.name ?
  * @property {?Object} transcodingStatus.data ?
  * @property {?Object} uploadStatus ?
  * @property {string} uploadStatus.name ?
  * @property {?Object} uploadStatus.data ?
  */
const videoSchema = joi.object({
  id: joi.string().default(null),
  author: joi.string().empty('').default('').allow(null),
  description: joi.string().empty('').default(''),
  duration: joi.string().empty('').default('').allow(null),
  filename: joi.string().empty('').default('').allow(null).allow(''),
  filesize: joi.number(),
  free: joi.string().empty('').default(null).allow(null),
  ipfsHashOrig: joi.string().empty('').default(''),
  ipfsHash: joi.string().empty('').default(''),
  owner: joi.string().required(),
  price: joi.number().default(0),
  // published: joi.any().default(false).allow(null),
  title: joi.string().empty('').default(''),
  thumbnails: joi.array(),
  storageStatus: joi.object({
    name: joi.string().required(),
    data: joi.object().allow(null)
  }).optional().default({}),
  transcodingStatus: joi.object({
    name: joi.string().required(),
    data: joi.object().allow(null)
  }).allow(null).default({}),
  uploadStatus: joi.object({
    name: joi.string().required(),
    data: joi.object().allow(null)
  }).allow(null).default({})
})

export { accountSchema, ethSchema, ipfsSchema, dbSchema, videoSchema }