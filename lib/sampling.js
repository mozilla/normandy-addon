const {Cu} = require('chrome');
Cu.importGlobalProperties(['crypto', 'TextEncoder']);

const {Log} = require('./Log.js');

/**
 * Map from the range [0, 1] to [0, max(sha256)].
 * @param  {number} frac A float from 0.0 to 1.0.
 * @return {string} A string in the sha256 hash space. Will be zero padded to 64
 *   characters.
 */
function fractionToKey(frac) {
  // SHA 256 hashes are 64-digit hexadecimal numbers. The largest possible SHA
  // 256 hash is 2^256 - 1.

  if (frac < 0 || frac > 1) {
    throw new Error(`frac must be between 0 and 1 inclusive (got ${frac})`);
  }

  const mult = Math.pow(2, 256) - 1;
  const inDecimal = Math.floor(frac * mult);
  let hexDigits = inDecimal.toString(16);
  if (hexDigits.length < 64) {
    // Left pad with zeroes
    // If N zeroes are needed, generate an array of nulls N+1 elements long,
    // and inserts zeroes between each null.
    hexDigits = Array(64 - hexDigits.length + 1).join('0') + hexDigits;
  }

  // Saturate at 2**256 - 1
  if (hexDigits.length > 64) {
    hexDigits = Array(65).join('f');
  }

  return hexDigits;
}

function bufferToHex(buffer) {
  let hexCodes = [];
  let view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    let value = view.getUint32(i);
    // toString(16) will give the hex representation of the number without padding
    let stringValue = value.toString(16);
    // We use concatenation and slice for padding
    let padding = '00000000';
    let paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join('');
}

exports.stableSample = function(input, rate) {
  const hasher = crypto.subtle;

  return hasher.digest('SHA-256', new TextEncoder('utf-8').encode(JSON.stringify(input)))
    .then(hash => {
      const inputHash = bufferToHex(hash);
      const samplePoint = fractionToKey(rate);

      if (samplePoint.length !== 64 || inputHash.length !== 64) {
        throw new Error('Unexpected hash length');
      }

      return inputHash < samplePoint;

    })
    .catch(error => {
      Log.error(`Error: ${error}`);
    });
};

/**
 * Sample by splitting the input space into a series of buckets, and checking
 * if the given input is in a range of buckets.
 *
 * The range to check is defined by a start point and length, and can wrap
 * around the input space. For example, if there are 100 buckets, and we ask to
 * check 50 buckets starting from bucket 70, then buckets 70-100 and 0-19 will
 * be checked.
 *
 * @param  {object}  input Input to hash to determine the matching bucket.
 * @param  {integer} start Index of the bucket to start checking.
 * @param  {integer} count Number of buckets to check.
 * @param  {integer} total Total number of buckets to group inputs into.
 * @return {boolean}       True if the given input is within the range of
 *                         buckets we're checking.
 */
exports.bucketSample = function(input, start, count, total) {
  const hasher = crypto.subtle;

  return hasher.digest('SHA-256', new TextEncoder('utf-8').encode(JSON.stringify(input)))
    .then(hash => {
      const inputHash = bufferToHex(hash);
      const wrappedStart = start % total;
      const end = wrappedStart + count;

      // If the range we're testing wraps, we have to check two ranges: from start
      // to max, and from min to end.
      if (end > total) {
        return (
          rangeBucketSample(inputHash, 0, end % total, total)
          || rangeBucketSample(inputHash, wrappedStart, total, total)
        );
      }

      return rangeBucketSample(inputHash, wrappedStart, wrappedStart + count, total);
    })
    .catch(error => {
      Log.error(`Error: ${error}`);
    });
};

function rangeBucketSample(inputHash, minBucket, maxBucket, bucketCount) {
  const minHash = fractionToKey(minBucket / bucketCount);
  const maxHash = fractionToKey(maxBucket / bucketCount);
  return (minHash <= inputHash) && (inputHash < maxHash);
}
