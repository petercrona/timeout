import { bufferAdd, mkBuffer } from "./buffer.js";

export const mkSimpleMovingAverage = (maxValues) => ({
  nrValues: 0,
  currentMean: null,
  currentVarianceHelperValue: 0,
  buffer: mkBuffer(maxValues),
});

export const simpleMovingAverageReport = (mean, value) => {
  const removed = bufferAdd(mean.buffer, value);
  simpleMovingAverageRemove(mean, removed);

  if (mean.nrValues > 0) {
    const prevMean = mean.currentMean;
    mean.currentMean += (value - prevMean) / (mean.nrValues + 1);
    mean.currentVarianceHelperValue +=
      (value - prevMean) * (value - mean.currentMean);
  } else {
    mean.currentMean = value;
  }

  mean.nrValues++;
};

const simpleMovingAverageRemove = (mean, value) => {
  if (value === null) {
    return;
  }

  if (mean.nrValues <= 1) {
    mean.currentMean = 0;
    mean.currentVarianceHelperValue = 0;
    mean.nrValues = 0;
    return;
  }

  const n = mean.nrValues;
  const oldMean = (n * mean.currentMean - value) / (n - 1);
  mean.currentVarianceHelperValue -=
    (value - oldMean) * (value - mean.currentMean);
  mean.currentMean = oldMean;
  mean.nrValues--;
};

export const simpleMovingAverageVariance = (mean) => {
  if (mean.nrValues <= 1) return 0;
  return Math.max(mean.currentVarianceHelperValue, 0) / (mean.nrValues - 1);
};
