const noDDOSIps = [
  [0.0035, "192.168.0.1"],
  [0.0015, "192.168.0.2"],
  [0.001, "192.168.0.3"],
  [0.0008, "192.168.0.4"],
  [0.0006, "192.168.0.5"],
  [0.0004, "192.168.0.6"],
  [0.0003, "192.168.0.7"],
  [0.00025, "192.168.0.8"],
  [0.0002, "192.168.0.9"],
  [0.00015, "192.168.0.10"],
  [0.0001, "192.168.0.11"],
  [0.0001, "192.168.0.12"],
  [0.0001, "192.168.0.13"],
  [0.0001, "192.168.0.14"],
  [0.0001, "192.168.0.15"],
  [0.0001, "192.168.0.16"],
  [0.00005, "192.168.0.17"],
  [0.00005, "192.168.0.18"],
  [0.00005, "192.168.0.19"],
  [0.00005, "192.168.0.20"],
];

const DDOSIps = [
  // DDoS IPs (95% total)
  [0.4, "10.0.0.1"],
  [0.35, "10.0.0.2"],
  [0.2, "10.0.0.3"],

  // Normal traffic IPs (5% total)
  [0.0035, "192.168.0.1"],
  [0.0015, "192.168.0.2"],
  [0.001, "192.168.0.3"],
  [0.0008, "192.168.0.4"],
  [0.0006, "192.168.0.5"],
  [0.0004, "192.168.0.6"],
  [0.0003, "192.168.0.7"],
  [0.00025, "192.168.0.8"],
  [0.0002, "192.168.0.9"],
  [0.00015, "192.168.0.10"],
  [0.0001, "192.168.0.11"],
  [0.0001, "192.168.0.12"],
  [0.0001, "192.168.0.13"],
  [0.0001, "192.168.0.14"],
  [0.0001, "192.168.0.15"],
  [0.0001, "192.168.0.16"],
  [0.00005, "192.168.0.17"],
  [0.00005, "192.168.0.18"],
  [0.00005, "192.168.0.19"],
  [0.00005, "192.168.0.20"],
];

// for 2, 4, ..., 60
const x2CriticalValues = [
  0.002001001, 0.090804036, 0.381066755, 0.857104827, 1.478743464, 2.214209321,
  3.040672521, 3.941627843, 4.904848809, 5.921040745, 6.982968441, 8.084881581,
  9.222126824, 10.390879116, 11.587951046, 12.810654583, 14.056698789,
  15.324112792, 16.611186837, 17.916426535, 19.238516869, 20.576293552,
  21.928719989, 23.29486856, 24.673905272, 26.065077086, 27.467701351,
  28.881156949, 30.304876817, 31.738341594,
];

const tCriticalValues = [
  6.313752, 2.919986, 2.353363, 2.131847, 2.015048, 1.94318, 1.894579, 1.859548,
  1.833113, 1.812461, 1.795885, 1.782288, 1.770933, 1.76131, 1.75305, 1.745884,
  1.739607, 1.734064, 1.729133, 1.724718, 1.720743, 1.717144, 1.713872,
  1.710882, 1.708141, 1.705618, 1.703288, 1.701131, 1.699127, 1.697261,
];

const buffer_mkBuffer = (maxValues) => ({
  maxValues,
  values: [],
});

const buffer_add = (buffer, value) => {
  buffer.values.push(value);
  if (buffer.values.length > buffer.maxValues) {
    return buffer.values.shift();
  } else {
    return null;
  }
};

const mean_mkMean = () => ({
  nrValues: 0,
  currentMean: null,
  currentVarianceHelperValue: 0,
});

const mean_report = (mean, value) => {
  if (mean.nrValues > 0) {
    prevMean = mean.currentMean;
    mean.currentMean += (value - prevMean) / (mean.nrValues + 1);
    mean.currentVarianceHelperValue +=
      (value - prevMean) * (value - mean.currentMean);
  } else {
    mean.currentMean = value;
  }

  mean.nrValues++;
};

const mean_remove = (mean, value) => {
  if (value === null) {
    return;
  }

  if (mean.nrValues <= 1) {
    // If there is only one value (or none), reset the statistics.
    mean.currentMean = 0;
    mean.currentVarianceHelperValue = 0;
    mean.nrValues = 0;
    return;
  }

  const n = mean.nrValues; // current number of samples (after addition)

  // Calculate the original mean before this value was added.
  const oldMean = (n * mean.currentMean - value) / (n - 1);

  // Revert the variance helper.
  mean.currentVarianceHelperValue -=
    (value - oldMean) * (value - mean.currentMean);

  // Restore the previous mean and decrease the count.
  mean.currentMean = oldMean;
  mean.nrValues--;
};

const mean_variance = (mean) => {
  if (mean.nrValues <= 1) return 0;
  // Clamp the variance helper to 0 if it's negative due to floating-point errors.
  const varianceHelper = Math.max(mean.currentVarianceHelperValue, 0);
  return varianceHelper / (mean.nrValues - 1);
};

const mean_reset = (mean) => {
  mean.nrValues = 0;
  mean.currentMean = null;
  mean.currentVarianceHelperValue = 0;
  return mean;
};

const rates = [];

const filter = () => {
  const shortTermMean = mean_mkMean();
  const longTermMeanReqPerIp = mean_mkMean();
  const longTermMean = mean_mkMean();
  const longTermBuffer = buffer_mkBuffer(30);
  const longTermReqPerIpBuffer = buffer_mkBuffer(30);

  const longTermMeanReqPerIpVariance = mean_mkMean();
  const longTermReqPerIpVarianceBuffer = buffer_mkBuffer(30);

  const ips = buffer_mkBuffer(30);

  let lastReq = Date.now();
  return (req) => {
    const timeToReq = Date.now() - lastReq;

    mean_report(shortTermMean, timeToReq);
    buffer_add(ips, req.ip);

    if (shortTermMean.nrValues === 30) {
      // Only if not anamoly
      // Assume current is true, which is a gamma(n, lambda)
      const chiSquareStat =
        2 *
        longTermMean.nrValues *
        (1 / longTermMean.currentMean) *
        shortTermMean.currentMean;

      const critical = x2CriticalValues[longTermMean.nrValues - 1];

      if (chiSquareStat > critical || longTermMean.nrValues === 0) {
        mean_report(longTermMean, shortTermMean.currentMean);
        const requestPerIpStats = getRequestsPerIpStats(ips.values);
        const meanPerIp = requestPerIpStats.mean;
        const variancePerIp = requestPerIpStats.variance;
        mean_report(longTermMeanReqPerIp, meanPerIp);
        mean_report(longTermMeanReqPerIpVariance, variancePerIp);

        const removedValue = buffer_add(
          longTermBuffer,
          shortTermMean.currentMean
        );

        const removedValuePerIp = buffer_add(longTermReqPerIpBuffer, meanPerIp);

        const removedValuePerIpVariance = buffer_add(
          longTermReqPerIpVarianceBuffer,
          variancePerIp
        );

        mean_remove(longTermMean, removedValue);
        mean_remove(longTermMeanReqPerIp, removedValuePerIp);
        mean_remove(longTermMeanReqPerIpVariance, removedValuePerIpVariance);
      } else {
        // do we have an anomaly w.r.t. requests per ip?
        // T-test, p=0.001
        // T-test so we can handle <30
        const tStat =
          (getRequestsPerIpStats(ips.values).mean -
            longTermMeanReqPerIp.currentMean) /
          Math.sqrt(longTermMeanReqPerIpVariance.currentMean);

        console.log(tCriticalValues[longTermMeanReqPerIp.nrValues - 1], tStat);
        if (tStat >= tCriticalValues[longTermMeanReqPerIp.nrValues - 1]) {
          // find IPs causing the problem
          // basically, those with p=0.05 assuming no anomaly
          // assume long term mean and variance. For each IP, what is prob of seeing
          // so many requests from IP?
          const reqPerIpThreshold =
            tCriticalValues[longTermMeanReqPerIpVariance.nrValues - 1] *
              Math.sqrt(longTermMeanReqPerIpVariance.currentMean) +
            longTermMeanReqPerIp.currentMean;

          const ipsToBan = Object.entries(
            ips.values.reduce((res, ip) => {
              res[ip] = (res[ip] ?? 0) + 1;
              return res;
            }, {})
          )
            .filter(([, reqs]) => reqs >= reqPerIpThreshold)
            .map(([ip]) => ip);

          // Set Retry-After, which is respected by Axios
          // we return 429 - Too many requests
          // to prevent infinite grow, clear "timeout" hashmap once it reaches 10000 IPs.
          console.log("ban", ipsToBan);
        }
      }

      mean_reset(shortTermMean);
    }

    lastReq = Date.now();
  };
};

const app = filter();

const getIp = (ips) => {
  const totalWeight = ips.reduce((sum, [weight]) => sum + weight, 0);
  const rand = Math.random() * totalWeight;
  let cumulative = 0;

  for (const [weight, ip] of ips) {
    cumulative += weight;
    if (rand < cumulative) {
      return ip;
    }
  }
};

const getRequestsPerIpStats = (ips) => {
  const ipCounts = {};

  // Count requests per IP
  for (const ip of ips) {
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  }

  const counts = Object.values(ipCounts);
  const numIps = counts.length;
  const totalRequests = counts.reduce((sum, c) => sum + c, 0);
  const mean = totalRequests / numIps;

  const variance =
    counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / numIps;

  return { mean, variance };
};

for (let i = 0; i < 990; i++) {
  app({
    ip: getIp(noDDOSIps),
  });
  sleepSync((1000 / 50) * Math.random() * 2);
}

for (let i = 0; i < 900; i++) {
  app({
    ip: getIp(DDOSIps),
  });
  sleepSync(1000 / 100);
}

for (let i = 0; i < 990; i++) {
  app({
    ip: getIp(noDDOSIps),
  });
  sleepSync((1000 / 50) * Math.random() * 20);
}

console.log("Done");

function sleepSync(ms) {
  const start = Date.now();
  while (Date.now() - start < ms);
}
