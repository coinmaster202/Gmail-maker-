// worker.js

self.onmessage = function (e) {
  const { username, max } = e.data;

  const clean = username.replace(/[^a-zA-Z0-9]/g, "");
  const positions = clean.length - 1;
  const total = Math.pow(2, positions);

  const results = [];

  for (let i = 1; i < total && results.length < max; i++) {
    let result = "";
    for (let j = 0; j < clean.length; j++) {
      result += clean[j];
      if (j < clean.length - 1 && (i & (1 << (positions - 1 - j)))) {
        result += ".";
      }
    }

    results.push(result + "@gmail.com");

    // Optional progress reporting every 100k
    if (i % 100000 === 0) {
      self.postMessage({ progress: i, partial: results.length });
    }
  }

  self.postMessage({ done: true, emails: results });
};