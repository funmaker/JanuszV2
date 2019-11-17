export function newBlock(numberOfChannels, blockSize) {
  const block = [];
  for(let ch = 0; ch < numberOfChannels; ch++) block.push(new Float32Array(blockSize));
  return block;
}
