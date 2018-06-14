'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

exports.patchWallet = patchWallet;

var _utils = require('./utils.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bip39 = require('bip39'); // this code is lifted and adapted from ethereumjs-lightwallet

var hdkey = require('hdkey');
/**
 * extends the native web3 wallet object with some new operations
 * @param  {Object} wallet wallet to patch
 * @return {Object}        patched wallet
 * @private
 */
function patchWallet(wallet) {
  /**
   * Create a wallet with a given number of accounts from a BIP39 mnemonic
   * @param  {number} numberOfAccounts number of accounts to be created
   * @param  {string=} mnemonic mnemonic of the wallet, if not specified a random one is generated
   * @return {Object} the created wallet
   * @example wallet = await wallet.createFromMnemonic(5, 'some long mnemonic phrase')
   */
  function createFromMnemonic(numberOfAccounts, mnemonic) {
    var seed, masternode, i, child, privkeyHex, privateKey;
    return _regenerator2.default.async(function createFromMnemonic$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(this.length > 0)) {
              _context.next = 2;
              break;
            }

            throw Error('This wallet has already been created!');

          case 2:
            if (numberOfAccounts === undefined) {
              numberOfAccounts = 1;
            }
            if (mnemonic === undefined) {
              mnemonic = bip39.generateMnemonic();
            }

            if (!bip39.validateMnemonic(mnemonic)) {
              _context.next = 10;
              break;
            }

            seed = bip39.mnemonicToSeed(mnemonic);
            // contains masternode extended priv key and extended pub key

            masternode = hdkey.fromMasterSeed(seed);


            for (i = 0; i < numberOfAccounts; ++i) {
              // m / purpose' / coin_type' / account' / change / address_index
              child = masternode.derive('m/44\'/60\'/0\'/0/' + i);
              privkeyHex = child.privateKey.toString('hex');
              privateKey = this._accounts.privateKeyToAccount((0, _utils.add0x)(privkeyHex)).privateKey;

              this.add(privateKey);
            }
            _context.next = 11;
            break;

          case 10:
            throw Error('Mnemonic was not valid: ' + mnemonic);

          case 11:
            return _context.abrupt('return', this);

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, null, this);
  }
  /**
   * check if the passed mnemonic is bip39 valid
   * @param  {string}  mnemonic mnemonic to check
   * @return {Boolean}          true if the mnemonic is valid, false otherwise
   * @example paratii.eth.wallet.isValidMnemonic('some long mnemonic phrase')
    */
  function isValidMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
  }
  /**
   * generates a new mnemonic
   * @return {string} newly generated mnemonic
   * @example let newMnemonic = paratii.eth.wallet.generateMnemonic()
    */
  function newMnemonic() {
    return bip39.generateMnemonic();
  }

  wallet.createFromMnemonic = createFromMnemonic;
  wallet.isValidMnemonic = isValidMnemonic;
  wallet.newMnemonic = newMnemonic;
  return wallet;
}