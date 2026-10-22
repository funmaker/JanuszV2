import React, { useEffect, useEffectEvent, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Button, MenuItem, Select, styled } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import axios, { Canceler } from "axios";
import { LogsFile, LogsMessage, LogsRequest, LogsResponse } from "../../../../types/api";
import requestJSON from "../../helpers/requestJSON";
import { ClientError } from "../../helpers/clientError";
import useRequest from "../../hooks/useRequest";
import useWebSocket from "../../hooks/useWebSocket";
import LoadingOverlay from "../../components/LoadingOverlay";
import PanelButtons from "../../components/PanelButtons";

export const name = "Logs";

const NOW = "*NOW*";
const FETCH_MARGIN = 500;
const DROP_MARGIN = 3000;

interface LogPageData {
  start: number;
  logs: string[];
}

interface LogsState {
  file: string;
  pages: LogPageData[];
  start: number | null;
  end: number | null;
  size: number | null;
}

type LogsAction
  = | { type: "reset"; file: string }
  | { type: "jump"; position: number }
  | { type: "fetched"; response: LogsResponse }
  | { type: "live"; message: LogsMessage }
  | { type: "insert"; page: LogPageData }
  | { type: "dropFirst" }
  | { type: "dropLast" };

const initialState: LogsState = { file: NOW, pages: [], start: null, end: null, size: null };

function insertPage(pages: LogPageData[], page: LogPageData) {
  const covered = (id: number) => pages.some(p => id >= p.start && id < p.start + p.logs.length);
  
  let { start, logs } = page;
  while(logs.length > 0 && covered(start)) {
    start++;
    logs = logs.slice(1);
  }
  while(logs.length > 0 && covered(start + logs.length - 1)) logs = logs.slice(0, -1);
  if(logs.length === 0) return pages;
  
  return [...pages, { start, logs }].sort((a, b) => a.start - b.start);
}

function logsReducer(state: LogsState, action: LogsAction): LogsState {
  switch(action.type) {
    case "reset":
      return { ...initialState, file: action.file };
    
    case "jump":
      return { ...state, pages: [], start: action.position, end: action.position };
    
    case "fetched": {
      const { response } = action;
      return {
        ...state,
        pages: insertPage(state.pages, { start: response.start, logs: response.logs }),
        start: state.start !== null ? Math.min(response.start, state.start) : response.start,
        end: state.end !== null ? Math.max(response.end, state.end) : response.end,
        size: response.totalSize,
      };
    }
    
    case "live":
      return {
        ...state,
        pages: insertPage(state.pages, { start: action.message.id, logs: [action.message.text] }),
        end: action.message.id + 1,
        size: action.message.id + 1,
      };
    
    case "insert":
      return { ...state, pages: insertPage(state.pages, action.page) };
    
    case "dropFirst":
      if(state.pages.length <= 1 || state.start === null) return state;
      return { ...state, pages: state.pages.slice(1), start: state.pages[1].start };
    
    case "dropLast": {
      if(state.pages.length <= 1 || state.end === null) return state;
      const last = state.pages[state.pages.length - 1];
      return { ...state, pages: state.pages.slice(0, -1), end: last.start };
    }
    
    default:
      return state;
  }
}

function logError(err: ClientError) {
  if(!axios.isCancel(err.inner)) console.error(err);
}

interface ScrollMetrics {
  top: number;
  bottom: number;
}

function LogPage({ logs, start }: LogPageData) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return <div dangerouslySetInnerHTML={{ __html: logs.map((line, n) => `<span class="lineNumber" data-num="${start + n + 1}"></span>${line}`).join("<br />") }} />;
}

export function Panel() {
  const files = useRequest<LogsFile[]>("/web/logsFiles");
  const [state, dispatch] = useReducer(logsReducer, initialState);
  const [scroll, setScroll] = useState<ScrollMetrics>({ top: 0, bottom: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevRange = useRef<{ start: number | null; end: number | null }>({ start: null, end: null });
  const nextLiveId = useRef<number | null>(null);
  
  const live = state.file === NOW && state.size !== null && state.end === state.size;
  
  let request: LogsRequest | null = null;
  if(state.size === null) request = {};
  else if(state.start !== null && state.start !== 0 && scroll.top < FETCH_MARGIN) request = { end: state.start };
  else if(!live && state.end !== null && state.end !== state.size && scroll.bottom < FETCH_MARGIN) request = { start: state.end };
  
  const requestKey = request && JSON.stringify({ ...request, format: "html", file: state.file === NOW ? undefined : state.file });
  
  useEffect(() => {
    if(!requestKey) return;
    
    let cancel: Canceler | null = null;
    requestJSON<LogsResponse>({ url: "/web/logs", search: JSON.parse(requestKey), cancelCb: c => { cancel = c; } })
      .then(response => dispatch({ type: "fetched", response }))
      .catch(logError);
    
    return () => cancel?.();
  }, [requestKey]);
  
  useWebSocket(live ? "/web/logs?format=html" : null, {
    onOpen: () => {
      nextLiveId.current = null;
    },
    onMessage: msg => {
      const message: LogsMessage = JSON.parse(msg.data);
      const expected = nextLiveId.current ?? state.end; // Messages can arrive faster than renders
      nextLiveId.current = Math.max(expected ?? 0, message.id + 1);
      
      if(expected !== null && expected < message.id) { // Fill the gap
        requestJSON<LogsResponse>({ url: "/web/logs", search: { format: "html", start: expected, end: message.id } })
          .then(({ logs, start }) => dispatch({ type: "insert", page: { logs, start } }))
          .catch(logError);
      }
      
      dispatch({ type: "live", message });
    },
  });
  
  const measure = () => {
    const div = scrollRef.current;
    if(!div) return;
    
    const metrics = {
      top: div.scrollTop,
      bottom: div.scrollHeight - div.scrollTop - div.clientHeight,
    };
    setScroll(metrics);
    
    if(metrics.top > DROP_MARGIN) dispatch({ type: "dropFirst" });
    else if(metrics.bottom > DROP_MARGIN) dispatch({ type: "dropLast" });
  };
  
  const onResize = useEffectEvent(measure);
  
  useEffect(() => {
    const div = scrollRef.current;
    const content = contentRef.current;
    if(!div || !content) return;
    
    const observer = new ResizeObserver(() => onResize());
    observer.observe(div);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
  
  // Keep the view anchored when lines are added or removed above, and stick to the bottom when following new lines
  useLayoutEffect(() => {
    const div = scrollRef.current;
    if(!div) return;
    
    if(state.start !== prevRange.current.start) {
      div.scrollTop = div.scrollHeight - div.clientHeight - scroll.bottom;
    } else if(state.end !== prevRange.current.end && scroll.bottom <= 1) {
      div.scrollTop = div.scrollHeight - div.clientHeight;
    }
    
    prevRange.current = { start: state.start, end: state.end };
  }, [state.start, state.end, scroll.bottom]);
  
  const onDeleteAll = async () => {
    dispatch({ type: "reset", file: NOW });
    await requestJSON({ url: "/web/deleteLogs", method: "POST" });
    files.refresh();
  };
  
  const filesOptions = [...files.data ?? []].sort((a, b) => a.created - b.created).map(file => ({
    value: file.filename,
    text: (new Date(file.created)).toLocaleString(),
  }));
  filesOptions.push({ value: NOW, text: "Now" });
  
  return (
    <>
      <StyledLogs ref={scrollRef} onScroll={measure}>
        <div ref={contentRef}>
          {state.pages.map(page => <LogPage key={page.start} start={page.start} logs={page.logs} />)}
        </div>
      </StyledLogs>
      <LoadingOverlay active={!!requestKey} dark />
      <PanelButtons>
        <Select size="small"
                value={state.file}
                onChange={ev => dispatch({ type: "reset", file: ev.target.value })}
                MenuProps={{ anchorOrigin: { vertical: "top", horizontal: "left" }, transformOrigin: { vertical: "bottom", horizontal: "left" } }}>
          {filesOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.text}</MenuItem>)}
        </Select>
        <Button title="Remove all logs" onClick={() => void onDeleteAll().catch(console.error)}><DeleteIcon /></Button>
        <Button title="Top"
                disabled={state.start === 0}
                onClick={() => dispatch({ type: "jump", position: 0 })}>
          <ArrowUpwardIcon />
        </Button>
        <Button title="Bottom"
                disabled={state.end === state.size}
                onClick={() => state.size !== null && dispatch({ type: "jump", position: state.size })}>
          <ArrowDownwardIcon />
        </Button>
      </PanelButtons>
    </>
  );
}

const StyledLogs = styled("div")`
  position: absolute;
  inset: 0;
  padding: 0.5em 0.5em 3em;
  overflow-y: auto;
  overflow-anchor: none;
  background-color: ${props => props.theme.palette.background.terminal};
  color: #fff;
  font-family: 'Droid Sans Mono', Consolas, 'Lucida Console', Monaco, monospace;
  font-size: 0.9em;
  white-space: pre-wrap;
  word-break: break-word;
  
  .lineNumber::before {
    content: attr(data-num);
    display: inline-block;
    border-right: 1px solid gray;
    width: 6ch;
    text-align: right;
    padding-right: 1ch;
    margin-right: 1ch;
    color: grey;
    font-weight: bold;
  }
`;
