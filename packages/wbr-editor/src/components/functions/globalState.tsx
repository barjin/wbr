import React from "react";

export const HoverContext = React.createContext({
    isHovering: false,
    setHovering: (x: boolean) : void => {},
});

export const CollapseContext = React.createContext({
    isCollapsed: false,
    setCollapsed: (x: boolean) : void => {},
});