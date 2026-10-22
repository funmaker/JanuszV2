import { Transform, Readable, TransformCallback } from "stream";
import { BUFFER_SIZE } from "./constants";

export function mixDown(output: Buffer, inputs: Array<Buffer | Readable | null>): Buffer | null {
  const [base, ...rest] = inputs.map(input => input instanceof Readable ? input.read(BUFFER_SIZE * 2) as Buffer | null : input)
                                .filter(input => !!input);
  
  if(!base) {
    return null;
  }
  
  if(rest.length === 0 && base.length === output.length) {
    return base;
  }
  
  base.copy(output);
  let longest = base.length;
  
  for(const buffer of rest) {
    for(let n = 0; n < buffer.length; n += 2) {
      const a = output.readInt16LE(n);
      const b = buffer.readInt16LE(n);
      let val = a + b - a * b * Math.sign(a) / 32767;
      if(val < -32768) val = -32768;
      if(val > 32767) val = 32767;
      output.writeInt16LE(val, n);
    }
    if(buffer.length > longest) longest = buffer.length;
  }
  
  if(longest < output.length) {
    output.fill(0, longest);
  }
  
  return output;
}

export class StereoToMonoStream extends Transform {
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
    for(let n = 0; n < chunk.length; n += 4) {
      chunk[n / 2] = chunk[n];
      chunk[n / 2 + 1] = chunk[n + 1];
    }
    
    callback(null, chunk.subarray(0, chunk.length / 2));
  }
}

interface StateHolder {
  rawState: Record<string, any>;
  state: Record<string, any>;
}

// Binds an auto-accessor to the node's synchronized state. The initializer only provides a default value.
export function state<This extends StateHolder, Value>(target: ClassAccessorDecoratorTarget<This, Value>,
                                                       context: ClassAccessorDecoratorContext<This, Value>): ClassAccessorDecoratorResult<This, Value> {
  const name = context.name as string;
  
  return {
    get() { return this.state[name]; },
    set(value) { this.state[name] = value; },
    init(value) {
      if(this.rawState[name] === undefined) this.rawState[name] = value;
      return value;
    },
  };
}
