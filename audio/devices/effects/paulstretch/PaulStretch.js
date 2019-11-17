// paulstretch.js
// Copyright (C) 2014 Sébastien Piquemal
// Copyright (C) 2006-2011 Nasca Octavian Paul

import * as utils from "./utils";
import * as blockHelpers from "./block-helpers";
import * as arrayHelpers from "./array-helpers";

export default class PaulStretch {
  // Sets the stretch ratio. Note that blocks that have already been processed are using the old ratio.
  setRatio(val) {
    this.ratio = val;
    this.samplesIn.setDisplacePos((this.winSize * 0.5) / this.ratio);
  }
  
  // Returns the number of frames waiting to be processed
  writeQueueLength() { return this.samplesIn.getFramesAvailable(); }
  
  // Returns the number of frames already processed
  readQueueLength() { return this.samplesOut.getFramesAvailable(); }
  
  // Reads processed samples to `block`. Returns `block`, or `null` if there wasn't enough processed frames.
  read(block) { return this.samplesOut.read(block); }
  
  // Pushes `block` to the processing queue. Beware! The block is not copied, so make sure not to modify it afterwards.
  write(block) { this.samplesIn.write(block); }
  
  // Process samples from the queue. Returns the number of processed frames that were generated
  process = () => {
    // Read a block to blockIn
    if(this.samplesIn.read(this.blockIn) === null) return 0;
    
    // get the windowed buffer
    utils.applyWindow(this.blockIn, this.winArray);
    
    // Randomize phases for each channel
    for(let ch = 0; ch < this.numberOfChannels; ch++) {
      arrayHelpers.map(this.phaseArray, () => Math.random() * 2 * Math.PI);
      this.rephase(this.blockIn[ch], this.phaseArray);
    }
    
    // overlap-add the output
    utils.applyWindow(this.blockIn, this.winArray);
    
    for(let ch = 0; ch < this.numberOfChannels; ch++) {
      arrayHelpers.add(
        this.blockIn[ch].subarray(0, this.halfWinSize),
        this.blockOut[ch].subarray(this.halfWinSize, this.winSize),
      );
    }
    
    // Generate the output
    this.blockOut = this.blockIn.map(chArray => arrayHelpers.duplicate(chArray));
    this.samplesOut.write(this.blockOut.map(chArray => chArray.subarray(0, this.halfWinSize)));
    return this.halfWinSize;
  };
  
  toString() {
    return 'PaulStretch(' + this.numberOfChannels + 'X' + this.winSize + ')';
  }
  
  constructor(numberOfChannels = 1, ratio = 10, winSize = 4096) {
    this.numberOfChannels = numberOfChannels;
    this.ratio = ratio;
    this.winSize = winSize;
    this.halfWinSize = winSize / 2;
    
    this.samplesIn = new utils.Samples();
    this.samplesOut = new utils.Samples();
    
    this.setRatio(ratio);
    
    this.blockIn = blockHelpers.newBlock(numberOfChannels, winSize);
    this.blockOut = blockHelpers.newBlock(numberOfChannels, winSize);
    this.winArray = utils.createWindow(winSize);
    this.phaseArray = new Float32Array(this.halfWinSize + 1);
    this.rephase = utils.makeRephaser(winSize);
  }
}
