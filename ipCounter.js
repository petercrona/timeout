export const mkIpCounter = (desiredSampleSize) => ({
  desiredSampleSize,
  count: 0,
  countPerIp: {},
});

export const ipCounterAdd = (ipCounter, req) => {
  if (ipCounter.count === ipCounter.desiredSampleSize) {
    ipCounter.count = 0;
    ipCounter.countPerIp = {};
  }

  ipCounter.count++;
  ipCounter.countPerIp[req.ip] = (ipCounter.countPerIp[req.ip] ?? 0) + 1;
};

export const ipCounterSamplingComplete = (ipCounter) => {
  return ipCounter.count === ipCounter.desiredSampleSize;
};

export const getRequestsPerIpStats = ({ countPerIp, count }) => {
  const counts = Object.values(countPerIp);
  const numIps = counts.length;
  const mean = count / numIps;

  const variance =
    counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / numIps;

  return { mean, variance };
};
