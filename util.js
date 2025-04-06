export const sleepSync = (ms) => {
  const start = Date.now();
  while (Date.now() - start < ms);
};
