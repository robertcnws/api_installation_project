import { useEffect } from "react";

export function useSocketList(url, setItems) {
  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'created' || message.type === 'updated') {
        setItems((prevData) => {
          const idx = prevData.findIndex(
            (item) => String(item.id) === String(message.item.id)
          );

          if (idx !== -1) {
            const updated = [...prevData];
            updated[idx] = message.item;
            return updated;
          }

          return [message.item, ...prevData];
        });
      } else if (message.type === 'deleted') {
        setItems((prevData) =>
          prevData.filter((item) => String(item.id) !== String(message.item.id))
        );
      }
    };

    return () => {
      try {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      } catch (e) {
        console.error('Error closing socket', e);
      }
    };
  }, [url, setItems]);
}


export function useSocketRefetch(url, refetch) {
  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'created' || message.type === 'updated' || message.type === 'deleted') {
        refetch?.();
      }
    };

    return () => {
      try {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      } catch (e) {
        console.error('Error closing socket', e);
      }
    };
  }, [url, refetch]);
}