import EventEmitter from 'events';

export const logs: string[] = [];
export const logsEmitter = new EventEmitter<{ log: [line: string, id: number] }>();

function intercept(stream: NodeJS.WriteStream) {
  const write = stream.write.bind(stream) as (...args: any[]) => boolean;
  
  stream.write = ((chunk: string | Uint8Array, ...args: any[]) => {
    let text = chunk.toString();
    if(text.endsWith("\n")) text = text.slice(0, -1);
    for(const line of text.split("\n")) {
      logs.push(line);
      logsEmitter.emit('log', line, logs.length - 1);
    }
    
    return write(chunk, ...args);
  }) as typeof stream.write;
}

intercept(process.stdout);
intercept(process.stderr);
