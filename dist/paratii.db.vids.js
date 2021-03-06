'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParatiiDbVids = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var joi = require('joi');

var fetch = require('isomorphic-fetch');

/**
 * ParatiiDbUsers contains functionalities regarding the videos to interact with the Paratii Blockchain Index
 * @param {Object} config object to initialize Paratii object
 */

var ParatiiDbVids = exports.ParatiiDbVids = function () {
  function ParatiiDbVids(config) {
    (0, _classCallCheck3.default)(this, ParatiiDbVids);

    this.config = config;
    this.apiVideos = 'videos/';
  }
  /**
   * Get information about this video from the db
   * @param  {string}  videoId id of the video
   * @return {Promise}         data about the video
   * @example await paratii.db.vids.get('some-video-id')
   */


  (0, _createClass3.default)(ParatiiDbVids, [{
    key: 'get',
    value: function get(videoId) {
      var response, videoInfo;
      return _regenerator2.default.async(function get$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _regenerator2.default.awrap(fetch(this.config.db.provider + this.apiVideos + videoId, {
                method: 'get'
              }));

            case 2:
              response = _context.sent;
              videoInfo = response.json();
              return _context.abrupt('return', videoInfo);

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, null, this);
    }

    /**
     * Get the data of the video. See {@link ParatiiCoreVids#search}
     */

  }, {
    key: 'search',
    value: function search(options) {
      var schema, result, error, k, keyword, videos;
      return _regenerator2.default.async(function search$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              // FIXME: does not handle combinations of parameters yet
              schema = joi.object({
                'owner': joi.string().empty(),
                'keyword': joi.string().empty(),
                'offset': joi.number().integer().empty(),
                'limit': joi.number().integer().empty(),
                'staked': joi.boolean().empty()
              });
              result = joi.validate(options, schema);
              error = result.error;

              if (!error) {
                _context2.next = 5;
                break;
              }

              throw error;

            case 5:
              k = '';

              for (keyword in options) {
                k += keyword + '=' + options[keyword];
                k += '&';
              }
              if (k !== '') {
                k = '?' + k;
                k = k.slice(0, -1);
              }
              _context2.next = 10;
              return _regenerator2.default.awrap(fetch(this.config.db.provider + this.apiVideos + k, {
                method: 'get'
              }).then(function (response) {
                return response.json();
              }));

            case 10:
              videos = _context2.sent;
              return _context2.abrupt('return', videos);

            case 12:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }]);
  return ParatiiDbVids;
}();