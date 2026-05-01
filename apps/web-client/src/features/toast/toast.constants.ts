import type React from "react";

const TOAST_MIN_WIDTH = 100;
const TOAST_MAX_WIDTH = 280;

const TOAST_PADDING_Y = 6;
const TOAST_PADDING_X = 8;


export const toastCustomStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    width: "fit-content",
    minWidth: `${TOAST_MIN_WIDTH}px`,
    maxWidth: `${TOAST_MAX_WIDTH}px`,

    padding: `${TOAST_PADDING_Y}px ${TOAST_PADDING_X}px`,
    margin: "0 auto",

    textAlign: "center",
    borderRadius: "var(--radius-md)",

    overflow: "hidden", //cut off
    textOverflow: "ellipsis", //...
    whiteSpace: "nowrap", //oneline
};

//deprecated
export const toastBaseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: `${TOAST_PADDING_Y}px`,
    borderRadius: "var(--radius-md)",
};
