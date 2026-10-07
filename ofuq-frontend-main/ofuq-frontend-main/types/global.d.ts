// Ambient module declarations to satisfy TypeScript for UI libs without typings
declare module 'react-simple-maps' {
  import * as React from 'react';
  export const ComposableMap: React.ComponentType<any>;
  export const Geographies: React.ComponentType<any>;
  export const Geography: React.ComponentType<any>;
  export const Marker: React.ComponentType<any>;
}

declare module 'd3-geo' {
  // Minimal typing for the used API
  export function geoCentroid(feature: any): [number, number];
}