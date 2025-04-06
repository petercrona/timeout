// From R by `qt(0.95, dof)`, dof from 1 to 30
const tCriticalValues = [
  6.313752, 2.919986, 2.353363, 2.131847, 2.015048, 1.94318, 1.894579, 1.859548,
  1.833113, 1.812461, 1.795885, 1.782288, 1.770933, 1.76131, 1.75305, 1.745884,
  1.739607, 1.734064, 1.729133, 1.724718, 1.720743, 1.717144, 1.713872,
  1.710882, 1.708141, 1.705618, 1.703288, 1.701131, 1.699127, 1.697261,
];

export const upperTTest = (
  longTermMean,
  longTermVarianceMean,
  measuredMean
) => {
  const tStat =
    (measuredMean - longTermMean.currentMean) /
    Math.sqrt(longTermVarianceMean.currentMean);
  return tStat >= tCriticalValues[longTermMean.nrValues - 1];
};

export const getUpperThreshold = (longTermMean, longTermVarianceMean) => {
  return (
    tCriticalValues[longTermMean.nrValues - 1] *
      Math.sqrt(longTermVarianceMean.currentMean) +
    longTermMean.currentMean
  );
};
