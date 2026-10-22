import React, { useCallback, useReducer, useRef, useState } from 'react';
import { Button, ListSubheader, Menu, MenuItem, styled } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import * as packets from "../../../../audio/packets";
import { DeviceTypeData, InteractEvent, ServerPacket } from "../../../../audio/packets";
import useWebSocket from "../../hooks/useWebSocket";
import LoadingOverlay from "../../components/LoadingOverlay";
import PanelButtons from "../../components/PanelButtons";
import Cabbles, { LinkPreview } from "./Cabbles";
import Device from "./Device";
import { audioReducer, initialAudioState, snap } from "./audioState";

export const name = "Audio Manager";

type DragState
  = | { kind: "pan"; lastX: number; lastY: number }
  | { kind: "device"; uuid: string; offsetX: number; offsetY: number; posx: number; posy: number }
  | { kind: "link"; preview: LinkPreview };

export function Panel() {
  const [state, dispatch] = useReducer(audioReducer, initialAudioState);
  const [view, setView] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const offsetRef = useRef<HTMLDivElement>(null);
  
  const send = useWebSocket("/audio", {
    onOpen: () => dispatch({ type: "reset" }),
    onClose: () => dispatch({ type: "reset" }),
    onMessage: msg => dispatch({ type: "packet", packet: JSON.parse(msg.data) as ServerPacket }),
  });
  
  const toWorld = (ev: React.PointerEvent) => {
    const rect = offsetRef.current?.getBoundingClientRect();
    return { x: ev.clientX - (rect?.left ?? 0), y: ev.clientY - (rect?.top ?? 0) };
  };
  
  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    if(ev.button !== 0) return;
    const target = ev.target as HTMLElement;
    if(target.closest("[data-interactive]")) return;
    
    const world = toWorld(ev);
    const port = target.closest<HTMLElement>("[data-port]");
    const deviceEl = target.closest<HTMLElement>("[data-device]");
    
    if(port) {
      setDrag({
        kind: "link",
        preview: {
          device: port.dataset.device!,
          port: parseInt(port.dataset.port!),
          kind: port.dataset.kind as "input" | "output",
          ...world,
        },
      });
    } else if(deviceEl) {
      const device = state.devices[deviceEl.dataset.device!];
      if(!device) return;
      setDrag({ kind: "device", uuid: device.uuid, offsetX: world.x - device.posx, offsetY: world.y - device.posy, posx: device.posx, posy: device.posy });
    } else {
      setDrag({ kind: "pan", lastX: ev.clientX, lastY: ev.clientY });
    }
    
    ev.preventDefault();
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };
  
  const onPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if(!drag) return;
    
    if(drag.kind === "pan") {
      setView(view => ({ x: view.x + ev.clientX - drag.lastX, y: view.y + ev.clientY - drag.lastY }));
      setDrag({ ...drag, lastX: ev.clientX, lastY: ev.clientY });
    } else if(drag.kind === "device") {
      const world = toWorld(ev);
      const posx = snap(world.x - drag.offsetX);
      const posy = snap(world.y - drag.offsetY);
      if(posx !== drag.posx || posy !== drag.posy) setDrag({ ...drag, posx, posy });
    } else {
      setDrag({ ...drag, preview: { ...drag.preview, ...toWorld(ev) } });
    }
  };
  
  const onPointerUp = (ev: React.PointerEvent<HTMLDivElement>) => {
    if(!drag) return;
    setDrag(null);
    
    if(drag.kind === "device") {
      const device = state.devices[drag.uuid];
      if(device && (device.posx !== drag.posx || device.posy !== drag.posy)) {
        dispatch({ type: "move", uuid: drag.uuid, posx: drag.posx, posy: drag.posy });
        send(packets.deviceMovePacket(drag.uuid, drag.posx, drag.posy));
      }
    } else if(drag.kind === "link") {
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-port]");
      if(!target || target.dataset.kind === drag.preview.kind) return;
      
      const targetDevice = target.dataset.device!;
      const targetPort = parseInt(target.dataset.port!);
      const [from, output, to, input] = drag.preview.kind === "output"
        ? [drag.preview.device, drag.preview.port, targetDevice, targetPort]
        : [targetDevice, targetPort, drag.preview.device, drag.preview.port];
      
      const existing = Object.values(state.connections).find(con => con.from === from && con.to === to && con.output === output && con.input === input);
      if(existing) send(packets.deviceDisconnectPacket(existing.uuid));
      else send(packets.deviceConnectPacket(from, to, output, input));
    }
  };
  
  const onRemove = useCallback((uuid: string) => send(packets.deviceRemovePacket(uuid)), [send]);
  
  const onInteract = useCallback((device: string, node: string, event: InteractEvent) => {
    send(packets.interfaceInteractPacket(device, node, event));
  }, [send]);
  
  const addDevice = (deviceName: string) => {
    setMenuAnchor(null);
    send(packets.deviceAddPacket(deviceName, snap(-view.x), snap(-view.y)));
  };
  
  const devices = drag?.kind === "device" && state.devices[drag.uuid]
    ? { ...state.devices, [drag.uuid]: { ...state.devices[drag.uuid], posx: drag.posx, posy: drag.posy } }
    : state.devices;
  
  const groups = new Map<string | null, DeviceTypeData[]>();
  for(const type of [...state.types].sort((a, b) => a.deviceName.localeCompare(b.deviceName))) {
    groups.set(type.deviceNameGroup, [...groups.get(type.deviceNameGroup) ?? [], type]);
  }
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => a === null ? 1 : b === null ? -1 : a.localeCompare(b));
  
  const typeOption = (type: DeviceTypeData) => (
    <MenuItem key={type.deviceName}
              dense
              disabled={type.singleton && Object.values(state.devices).some(device => device.name === type.deviceName)}
              onClick={() => addDevice(type.deviceName)}>
      {type.deviceName}
    </MenuItem>
  );
  
  return (
    <>
      <StyledBoard onPointerDown={onPointerDown}
                   onPointerMove={onPointerMove}
                   onPointerUp={onPointerUp}
                   onPointerCancel={() => setDrag(null)}
                   style={{ backgroundPosition: `calc(${view.x}px + 50%) calc(${view.y}px + 50%)`, cursor: drag?.kind === "pan" ? "grabbing" : undefined }}>
        <div className="offset"
             ref={offsetRef}
             style={{ transform: `translate(${view.x}px, ${view.y}px)` }}>
          {Object.values(devices).map(device => (
            <Device device={device}
                    key={device.uuid}
                    onRemove={onRemove}
                    onInteract={onInteract} />
          ))}
          <Cabbles devices={devices} connections={state.connections} preview={drag?.kind === "link" ? drag.preview : null} />
        </div>
      </StyledBoard>
      <LoadingOverlay active={state.loading} dark />
      <PanelButtons>
        <Button title="Add device" onClick={ev => setMenuAnchor(ev.currentTarget)}><AddIcon /></Button>
      </PanelButtons>
      <Menu anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "bottom", horizontal: "left" }}>
        {sortedGroups.flatMap(([group, types]) => [
          group && <ListSubheader key={`group-${group}`}>{group}</ListSubheader>,
          ...types.map(typeOption),
        ])}
      </Menu>
    </>
  );
}

const StyledBoard = styled("div")`
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: ${props => props.theme.palette.background.board};
  background-image: radial-gradient(circle, ${props => props.theme.palette.background.boardDots} 1px, transparent 1.5px);
  background-size: 16px 16px;
  background-position: center center;
  cursor: move;
  touch-action: none;
  
  .offset {
    position: absolute;
    top: 50%;
    left: 50%;
    
    &::before {
      content: "";
      position: absolute;
      width: 100px;
      height: 100px;
      background: url(${props => props.theme.palette.mode === "dark" ? "/static/audio_dark.png" : "/static/audio.png"}) center / contain no-repeat;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
  }
`;
