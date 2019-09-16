export function newBlock(numberOfChannels, blockSize) {
  let block = [], ch;
  for (ch = 0; ch < numberOfChannels; ch++) block.push(new Float32Array(blockSize));
  return block
}
