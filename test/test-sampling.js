const testRunner = require('sdk/test');

const {bucketSample} = require('../lib/sampling.js');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports['bucketSample should match at about the right rate'] = assert => {
  const trials = 1000;
  const total = randInt(0, 10000);
  const start = randInt(0, total);
  const count = randInt(0, total - start);
  let hits = 0;
  for (let i = 0; i < trials; i++) {
    if (bucketSample(Math.random(), start, count, total)) {
      hits += 1;
    }
  }
  // 95% accurate
  const rate = count / total;
  assert.equal(Math.abs((hits / trials) - rate) < 0.05, true);
};

exports['bucketSample should be stable'] = assert => {
  for (let i = 0; i < 100; i++) {
    const total = randInt(0, 10000);
    const start = randInt(0, total);
    const count = randInt(0, total - start);
    const val = Math.random();
    const hit = bucketSample(val, start, count, total);
    for (let j = 0; j < 10; j++) {
      assert.equal(bucketSample(val, start, count, total), hit);
    }
  }
};

exports['bucketSample should group inputs into non-overlapping buckets'] = assert => {
  for (let i = 0; i < 100; i++) {
    const total = randInt(100, 10000);

    // Create 10 buckets, with the end of the count as the last.
    const bucketPoints = [];
    for (let k = 0; k < 9; k++) {
      bucketPoints.push(randInt(0, total));
    }
    bucketPoints.push(total);
    bucketPoints.sort((a, b) => a - b);

    // Generate a random value, and match it against the 10 buckets.
    // It should only match one of them.
    for (let j = 0; j < 10; j++) {
      const val = Math.random();
      let foundCount = 0;
      for (let k = 0; k < bucketPoints.length; k++) {
        const start = k === 0 ? 0 : bucketPoints[k - 1];
        const count = bucketPoints[k] - start;
        if (bucketSample(val, start, count, total)) {
          // Edge case: If we encounter the same bucketPoint three times,
          // we can get more than one match if the value is at the end
          // of the bucket, since the buckets (e.g. [1,1] and [1,1]) are
          // equivalent.
          const threeInARow = (
            k > 1 && count === 0 && start === bucketPoints[k - 2]
          );
          if (threeInARow && foundCount > 0) {
            // We hit the edge case! Let's not count it.
            continue;
          }

          foundCount++;
        }
      }
      assert.equal(foundCount, 1);
    }
  }
};

exports['bucketSample should wrap around if the bucket count exceeds the total'] = assert => {
  for (let i = 0; i < 5; i++) {
    const total = 100;

    // Generate a value and find the bucket it is in.
    const val = Math.random();
    let valBucket = null;
    for (let k = 0; k < total; k++) {
      if (bucketSample(val, k, 1, total)) {
        valBucket = k;
        break;
      }
    }
    assert.ok(!(valBucket === null), 'valBucket should not be null');

    // total - 20 potentially doesn't wrap, but is likely to, and total - 5
    // is guaranteed to wrap.
    assert.strictEqual(bucketSample(val, valBucket + 10, total - 20, total), false);
    assert.strictEqual(bucketSample(val, valBucket + 10, total - 5, total), true);
  }
};

testRunner.run(exports);
