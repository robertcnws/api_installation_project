import React, { useMemo, useContext, createContext } from 'react';

import { useTrackingQuery } from 'src/_mock/__tracking';

const TracksContext = createContext();
export const useTracks = () => useContext(TracksContext);

export function TracksProvider({ children }) {
  const { 
    data: tracks = [], 
    refetch: refetchTracks, 
    loading: loadingTracks, 
    error: errorTracks 
  } = useTrackingQuery();

  const loadedTracks = useMemo(() => tracks.filter((track) => track.action.toLowerCase().indexOf('login') === -1) || [], [tracks]);

  const value = useMemo(() => ({ 
    loadedTracks, 
    refetchTracks, 
    loadingTracks, 
    errorTracks 
}), [
    loadedTracks, 
    refetchTracks, 
    loadingTracks, 
    errorTracks 
]);

  return <TracksContext.Provider value={value}>{children}</TracksContext.Provider>;
}