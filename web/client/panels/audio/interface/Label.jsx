import React from "react";

export default function Label({ data }) {
  return (
    <div className="Label" style={{ width: data.state.size * 16 + 2 + "px" }}>
      { data.state.text }
    </div>
  );
}
