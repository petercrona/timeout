export const mkBuffer = (maxValues) => ({
  maxValues,
  values: [],
});

export const bufferAdd = (buffer, value) => {
  buffer.values.push(value);
  if (buffer.values.length > buffer.maxValues) {
    return buffer.values.shift();
  } else {
    return null;
  }
};
