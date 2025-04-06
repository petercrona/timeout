import { blocklistAdd, blocklistContains, mkBlocklist } from "./blocklist.js";
import {
  getRequestsPerIpStats,
  ipCounterAdd,
  ipCounterSamplingComplete,
  mkIpCounter,
} from "./ipCounter.js";
import {
  mkSimpleMovingAverage,
  simpleMovingAverageReport,
} from "./simpleMovingAverage.js";
import { generateIPDist, simulateRequests } from "./simulation.js";
import { getUpperThreshold, upperTTest } from "./ttest.js";

// We compute IP distribution and compare with baseline based on this number of samples.
// Default is 50, inspired by central limit theorem and wanting to keep overhead low.
const SAMPLE_EVERY_NR_REQUESTS = 50;

// Baseline is a simple moving average based on sample mean and variance measured
// "SAMPLE_EVERY_NR_REQUESTS". Default is 30, inspired by central limit theorem.
const BASELINE_MODEL_NR_SAMPLES = 30;

// FILTER

const filter = () => {
  const blocklist = mkBlocklist(10000);

  const longTermMeanReqPerIp = mkSimpleMovingAverage(BASELINE_MODEL_NR_SAMPLES);
  const longTermMeanReqPerIpVariance = mkSimpleMovingAverage(
    BASELINE_MODEL_NR_SAMPLES
  );
  const ipCounter = mkIpCounter(SAMPLE_EVERY_NR_REQUESTS);

  return (req) => {
    if (blocklistContains(blocklist, req.ip)) {
      console.log(`${req.ip} retry after 1s`);
      return;
    }

    ipCounterAdd(ipCounter, req);

    if (ipCounterSamplingComplete(ipCounter)) {
      const requestPerIpStats = getRequestsPerIpStats(ipCounter);
      const meanPerIp = requestPerIpStats.mean;
      const variancePerIp = requestPerIpStats.variance;
      simpleMovingAverageReport(longTermMeanReqPerIp, meanPerIp);
      simpleMovingAverageReport(longTermMeanReqPerIpVariance, variancePerIp);
    }

    const significantIncreaseReqPerIp = upperTTest(
      longTermMeanReqPerIp,
      longTermMeanReqPerIpVariance,
      getRequestsPerIpStats(ipCounter).mean
    );

    if (significantIncreaseReqPerIp) {
      const reqPerIpThreshold = getUpperThreshold(
        longTermMeanReqPerIp,
        longTermMeanReqPerIpVariance
      );

      Object.entries(ipCounter.countPerIp)
        .filter(([, reqs]) => reqs >= reqPerIpThreshold)
        .forEach(([ip]) => blocklistAdd(blocklist, ip));
    }
  };
};

// SIMULATION

const app = filter();

simulateRequests(
  app,
  990,
  generateIPDist([
    [1, 20], // 100% of traffic from 20 IPs
  ]),
  50
);
simulateRequests(
  app,
  900,
  generateIPDist([
    [0.95, 5], // 95% of traffic from 5 IPs
    [0.05, 20], // 5% from 20 IPs
  ]),
  100
);
simulateRequests(
  app,
  990,
  generateIPDist([
    [1, 10], // 100% of traffic from 10 IPs
  ]),
  50
);

console.log("Done");

/**
 * Note how 192.168.0.1 - 192.168.0.5 all got timeout.
 * As we managed to catch one IP, the others will make up a larger proporition
 * of all requests, and thus be even more likely to be caught.
 */
