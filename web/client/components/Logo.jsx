import React from 'react';
import { Image } from "semantic-ui-react";

function onDragOver(ev) {
  if(window.dataTransfer.getData("januszTab") === "true") {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }
}

export default function Logo() {
  return (
    <div className="Logo" onDragOver={onDragOver}>
      <Image src="/static/logo.png" />
    </div>
  );
}
