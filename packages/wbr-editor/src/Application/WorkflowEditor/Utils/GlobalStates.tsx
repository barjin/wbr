import React from 'react';

export const HoverContext = React.createContext({
  isHovering: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setHovering: (x: boolean) : void => {},
});

export const CollapseContext = React.createContext({
  isCollapsed: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCollapsed: (x: boolean) : void => {},
});

export const CurrentActionContext = React.createContext({
  currentIdx: -1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCurrent: (x: number) : void => {},
});

export const TutorialContext = React.createContext({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  nextStep: () : void => {},
});
