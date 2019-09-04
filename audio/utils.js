import { BUFFER_SIZE } from "./index";
import { Transform, Readable } from "stream";

export function mixDown(output, inputs) {
	let [base, ...rest] = inputs.map(input => input instanceof Readable ? input.read(BUFFER_SIZE * 2) : input)
															.filter(input => !!input);
	
	if(!base) {
		return null;
	}
	
	if(rest.length === 0 && base.length === output.length) {
		return base;
	}
	
	base.copy(output);
	let longest = base.length;
	
	for(let buffer of rest) {
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
	_transform(chunk, encoding, callback){
		
		for(let n = 0; n < chunk.length; n += 4) {
			chunk[n / 2] = chunk[n];
			chunk[n / 2 + 1] = chunk[n + 1];
		}
		
		callback(null, chunk.slice(0, chunk.length / 2));
	}
}
