import { sleepSync } from "./util.js";

export const generateIPDist = (dist) => {
  let ipList = [];
  let ipIndex = 1;

  dist.forEach(([totalWeight, count]) => {
    const weightPerIp = totalWeight / count;

    for (let i = 0; i < count; i++) {
      ipList.push([weightPerIp, `192.168.0.${ipIndex++}`]);
    }
  });

  return ipList;
};

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

export const simulateRequests = (app, numRequests, ips, reqsPerSecond) => {
  for (let i = 0; i < numRequests; i++) {
    app({
      ip: getIp(ips),
    });
    sleepSync(1000 / reqsPerSecond);
  }
};
