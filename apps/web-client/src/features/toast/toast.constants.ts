import type React from "react";

const TOAST_PADDING_PX = 6;

export const toastBaseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: `${TOAST_PADDING_PX}px`,
    backgroundColor: "var(--color-panel)",
    borderRadius: "var(--radius-md)",
    whiteSpace: "nowrap"
};