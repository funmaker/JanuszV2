import EventEmitter from 'events';
import intercept from "intercept-stdout";

export const logs = [];
export const logsEmitter = new EventEmitter();

intercept(text => {
  if(text.endsWith("\n")) text = text.slice(0, -1);
  for(const line of text.split("\n")) {
    logs.push(line);
    logsEmitter.emit('log', line, logs.length - 1);
  }
});

