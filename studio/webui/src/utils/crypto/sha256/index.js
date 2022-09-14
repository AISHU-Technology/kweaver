/* eslint-disable */
/**
 *
 * Secure Hash Algorithm (SHA256)
 * http://www.webtoolkit.info/
 *
 * Original code by Angel Marin, Paul Johnston.
 *
 **/
var chrsz = 8; /* bits per input character. 8 - ASCII; 16 - Unicode      */
var hexcase = 0;
var b64pad = ''; /* base-64 pad character. "=" for strict RFC compliance   */
var crypto = require('crypto');

var sha256 = require('crypto-js/sha256');
var hmacSHA256 = require('crypto-js/hmac-sha256');
var Base64 = require('crypto-js/enc-base64');
var Utf8 = require('crypto-js/enc-utf8');
var Hex = require('crypto-js/enc-hex');

export function hexHmacSha256(key, data) {
  return binl2hex(core_hmac_sha256(key, data));
}

export function base64HexHmacSha256(key, data) {
  return binl2b64(binl2hex(core_hmac_sha256(key, data)));
}

// openApi需求获取appkey算法
export function openAppId(appid, timestamp, params) {
  /**
   * 使用 crypto-js库
  const sha256timestamp = sha256(timestamp);
  const sha256paramString = sha256(params);
  const message = sha256timestamp.concat(sha256paramString);
  const shaString = hmacSHA256(message, appid);
*/

  // console.log('转json参数:', params);
  // console.log('strToUtf8Bytes:', strToUtf8Bytes(params));
  // console.log('strToHexCharCode:', strToHexCharCode(strToUtf8Bytes(params)));

  //时间戳加密
  var sha256timestamp = SHA256(timestamp);

  // 参数加密
  var sha256paramString = SHA256(params);

  // 不能用直接 + 的方式，会导致自动将 bytes 转换成字符串，导致与后端处理不一致，必须用自带的 contact 方法，在 bytes 层面进行组合
  var message = sha256timestamp.concat(sha256paramString);

  // Python: hmac.new(self.appid.encode("utf-8"), message, digestmod=sha256).digest()
  var shaString = hmacSHA256(message, appid);

  // Python: result = base64.b64encode(shaString.hex().encode("utf-8"))
  var shaString = Base64.stringify(Utf8.parse(shaString));

  return shaString;
}

// 字符串转字节
function strToUtf8Bytes(str) {
  const utf8 = [];
  for (let ii = 0; ii < str.length; ii++) {
    let charCode = str.charCodeAt(ii);
    if (charCode < 0x80) utf8.push(charCode);
    else if (charCode < 0x800) {
      utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      ii++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(ii) & 0x3ff));
      utf8.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }
  //兼容汉字，ASCII码表最大的值为127，大于127的值为特殊字符
  for (let jj = 0; jj < utf8.length; jj++) {
    var code = utf8[jj];
    if (code > 127) {
      utf8[jj] = code - 256;
    }
  }
  return utf8;
}

// 字节转16进制
function strToHexCharCode(str) {
  var hexCharCode = [];
  var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
  for (var i = 0; i < str.length; i++) {
    var bit = (str[i] & 0x0f0) >> 4;
    hexCharCode.push(chars[bit]);
    var bit = str[i] & 0x0f;
    hexCharCode.push(chars[bit]);
  }
  return hexCharCode.join('');
}

function core_hmac_sha256(key, data) {
  let bkey = str2binl(key);
  if (bkey.length > 16) bkey = core_sha256(bkey, key.length * chrsz);

  const ipad = Array(16);
  const opad = Array(16);

  for (let i = 0; i < 16; i++) {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5c5c5c5c;
  }

  const hash = core_sha256(ipad.concat(str2binl(data)), 512 + data.length * chrsz);

  return core_sha256(opad.concat(hash), 512 + 128);
}

/*
 * Convert an array of little-endian words to a hex string.
 */
function binl2hex(binarray) {
  const hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
  let str = '';

  for (let i = 0; i < binarray.length * 4; i++) {
    str +=
      hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
      hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
  }

  return str;
}

function safe_add(x, y) {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);

  return (msw << 16) | (lsw & 0xffff);
}

function S(X, n) {
  return (X >>> n) | (X << (32 - n));
}

function R(X, n) {
  return X >>> n;
}

function Ch(x, y, z) {
  return (x & y) ^ (~x & z);
}

function Maj(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}

function Sigma0256(x) {
  return S(x, 2) ^ S(x, 13) ^ S(x, 22);
}

function Sigma1256(x) {
  return S(x, 6) ^ S(x, 11) ^ S(x, 25);
}

function Gamma0256(x) {
  return S(x, 7) ^ S(x, 18) ^ R(x, 3);
}

function Gamma1256(x) {
  return S(x, 17) ^ S(x, 19) ^ R(x, 10);
}

function core_sha256(m, l) {
  const K = [
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0xfc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x6ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2
  ];
  const HASH = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Array(64);
  let a;
  let b;
  let c;
  let d;
  let e;
  let f;
  let g;
  let h;
  let i;
  let j;
  let T1;
  let T2;

  m[l >> 5] |= 0x80 << (24 - (l % 32));
  m[(((l + 64) >> 9) << 4) + 15] = l;
  for (i = 0; i < m.length; i += 16) {
    a = HASH[0];
    b = HASH[1];
    c = HASH[2];
    d = HASH[3];
    e = HASH[4];
    f = HASH[5];
    g = HASH[6];
    h = HASH[7];
    for (j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g;
      g = f;
      f = e;
      e = safe_add(d, T1);
      d = c;
      c = b;
      b = a;
      a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]);
    HASH[1] = safe_add(b, HASH[1]);
    HASH[2] = safe_add(c, HASH[2]);
    HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]);
    HASH[5] = safe_add(f, HASH[5]);
    HASH[6] = safe_add(g, HASH[6]);
    HASH[7] = safe_add(h, HASH[7]);
  }

  return HASH;
}

function str2binl(str) {
  const bin = Array();
  const mask = (1 << chrsz) - 1;

  for (let i = 0; i < str.length * chrsz; i += chrsz) bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << i % 32;

  return bin;
}

function str2binb(str) {
  const bin = [];
  const mask = (1 << chrsz) - 1;

  for (let i = 0; i < str.length * chrsz; i += chrsz) {
    bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - (i % 32));
  }

  return bin;
}

/*
 * Convert an array of little-endian words to a base-64 string
 */
function binl2b64(binarray) {
  const tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = '';

  for (let i = 0; i < binarray.length * 4; i += 3) {
    const triplet =
      (((binarray[i >> 2] >> (8 * (i % 4))) & 0xff) << 16) |
      (((binarray[(i + 1) >> 2] >> (8 * ((i + 1) % 4))) & 0xff) << 8) |
      ((binarray[(i + 2) >> 2] >> (8 * ((i + 2) % 4))) & 0xff);

    for (let j = 0; j < 4; j++) {
      if (i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> (6 * (3 - j))) & 0x3f);
    }
  }

  return str;
}

// sha256
function SHA256(s) {
  const chrsz = 8;
  const hexcase = 0;

  function safe_add(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);

    return (msw << 16) | (lsw & 0xffff);
  }

  function S(X, n) {
    return (X >>> n) | (X << (32 - n));
  }

  function R(X, n) {
    return X >>> n;
  }

  function Ch(x, y, z) {
    return (x & y) ^ (~x & z);
  }

  function Maj(x, y, z) {
    return (x & y) ^ (x & z) ^ (y & z);
  }

  function Sigma0256(x) {
    return S(x, 2) ^ S(x, 13) ^ S(x, 22);
  }

  function Sigma1256(x) {
    return S(x, 6) ^ S(x, 11) ^ S(x, 25);
  }

  function Gamma0256(x) {
    return S(x, 7) ^ S(x, 18) ^ R(x, 3);
  }

  function Gamma1256(x) {
    return S(x, 17) ^ S(x, 19) ^ R(x, 10);
  }

  function core_sha256(m, l) {
    const K = [
      0x428a2f98,
      0x71374491,
      0xb5c0fbcf,
      0xe9b5dba5,
      0x3956c25b,
      0x59f111f1,
      0x923f82a4,
      0xab1c5ed5,
      0xd807aa98,
      0x12835b01,
      0x243185be,
      0x550c7dc3,
      0x72be5d74,
      0x80deb1fe,
      0x9bdc06a7,
      0xc19bf174,
      0xe49b69c1,
      0xefbe4786,
      0xfc19dc6,
      0x240ca1cc,
      0x2de92c6f,
      0x4a7484aa,
      0x5cb0a9dc,
      0x76f988da,
      0x983e5152,
      0xa831c66d,
      0xb00327c8,
      0xbf597fc7,
      0xc6e00bf3,
      0xd5a79147,
      0x6ca6351,
      0x14292967,
      0x27b70a85,
      0x2e1b2138,
      0x4d2c6dfc,
      0x53380d13,
      0x650a7354,
      0x766a0abb,
      0x81c2c92e,
      0x92722c85,
      0xa2bfe8a1,
      0xa81a664b,
      0xc24b8b70,
      0xc76c51a3,
      0xd192e819,
      0xd6990624,
      0xf40e3585,
      0x106aa070,
      0x19a4c116,
      0x1e376c08,
      0x2748774c,
      0x34b0bcb5,
      0x391c0cb3,
      0x4ed8aa4a,
      0x5b9cca4f,
      0x682e6ff3,
      0x748f82ee,
      0x78a5636f,
      0x84c87814,
      0x8cc70208,
      0x90befffa,
      0xa4506ceb,
      0xbef9a3f7,
      0xc67178f2
    ];
    const HASH = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const W = new Array(64);
    let a;
    let b;
    let c;
    let d;
    let e;
    let f;
    let g;
    let h;
    let i;
    let j;
    let T1;
    let T2;

    m[l >> 5] |= 0x80 << (24 - (l % 32));
    m[(((l + 64) >> 9) << 4) + 15] = l;
    for (i = 0; i < m.length; i += 16) {
      a = HASH[0];
      b = HASH[1];
      c = HASH[2];
      d = HASH[3];
      e = HASH[4];
      f = HASH[5];
      g = HASH[6];
      h = HASH[7];
      for (j = 0; j < 64; j++) {
        if (j < 16) {
          W[j] = m[j + i];
        } else {
          W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
        }
        T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
        T2 = safe_add(Sigma0256(a), Maj(a, b, c));
        h = g;
        g = f;
        f = e;
        e = safe_add(d, T1);
        d = c;
        c = b;
        b = a;
        a = safe_add(T1, T2);
      }
      HASH[0] = safe_add(a, HASH[0]);
      HASH[1] = safe_add(b, HASH[1]);
      HASH[2] = safe_add(c, HASH[2]);
      HASH[3] = safe_add(d, HASH[3]);
      HASH[4] = safe_add(e, HASH[4]);
      HASH[5] = safe_add(f, HASH[5]);
      HASH[6] = safe_add(g, HASH[6]);
      HASH[7] = safe_add(h, HASH[7]);
    }

    return HASH;
  }

  function str2binb(str) {
    const bin = [];
    const mask = (1 << chrsz) - 1;

    for (let i = 0; i < str.length * chrsz; i += chrsz) {
      bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - (i % 32));
    }

    return bin;
  }

  function Utf8Encode(str) {
    const string = str.replace(/\r\n/g, '\n');
    let utfText = '';

    for (let n = 0; n < string.length; n++) {
      const c = string.charCodeAt(n);

      if (c < 128) {
        utfText += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utfText += String.fromCharCode((c >> 6) | 192);
        utfText += String.fromCharCode((c & 63) | 128);
      } else {
        utfText += String.fromCharCode((c >> 12) | 224);
        utfText += String.fromCharCode(((c >> 6) & 63) | 128);
        utfText += String.fromCharCode((c & 63) | 128);
      }
    }

    return utfText;
  }

  function binb2hex(binarray) {
    const hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
    let str = '';

    for (let i = 0; i < binarray.length * 4; i++) {
      str +=
        hex_tab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xf) +
        hex_tab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xf);
    }

    return str;
  }

  const s1 = Utf8Encode(s);

  return binb2hex(core_sha256(str2binb(s1), s.length * chrsz));
}
