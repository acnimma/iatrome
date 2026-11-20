'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { Drawing } from '@iatrome/game/client';
import { EMPTY_SNAPSHOT, RoomClient, type Snapshot } from './room-client';

/** Open (and own) a connection to a room for the lifetime of the component. */
export function useRoomConnection(code: string, asHost: boolean): RoomClient | null {
  const [client, setClient] = useState<RoomClient | null>(null);
  useEffect(() => {
    const c = new RoomClient(code, { asHost });
    setClient(c);
    return () => c.close();
  }, [code, asHost]);
  return client;
}

const empty: Snapshot = EMPTY_SNAPSHOT;

export function useSnapshot(client: RoomClient | null): Snapshot {
  return useSyncExternalStore(
    client?.subscribe ?? noopSubscribe,
    client?.getSnapshot ?? (() => empty),
    () => empty,
  );
}

const noopSubscribe = () => () => {};

// The rest of the tree reads the client from context.
export const RoomContext = createContext<RoomClient | null>(null);

export function useRoom(): RoomClient {
  const client = useContext(RoomContext);
  if (!client) throw new Error('useRoom must be used inside a RoomContext provider');
  return client;
}

/** A drawing from the cache, re-rendering whenever strokes arrive. */
export function useDrawing(id: string | null): Drawing | null {
  const client = useRoom();
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (!id) return;
    return client.onDrawing((changed) => {
      if (changed === id) setVersion((v) => v + 1);
    });
  }, [client, id]);
  return id ? (client.drawing(id) ?? null) : null;
}
