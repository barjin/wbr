import React from "react";

export const HoverContext = React.createContext({
    isHovering: false,
    setHovering: (x: boolean) : void => {},
});