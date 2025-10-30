import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Zeroconf from 'react-native-zeroconf';
import TcpSocket from 'react-native-tcp-socket';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';

import { TVMessage } from '@/types/message.interface';
import { TVDevice } from '@/types/tv-device.interface';
import { useSession } from '@/hooks/authentication/auth.context';

const clientId = Crypto.randomUUID();
const deviceInfo: TVDevice = {
  id: clientId,
  name: Device.deviceName ?? `${Device.DeviceType} ${clientId}`,
  platform: Platform.OS as 'tvos' | 'androidtv',
  host: '',
  port: 9999,
  addresses: [],
  lastSeen: new Date(),
  txt: {},
};

export function useTVServer() {
  const { token } = useSession();
  const [server, setServer] = useState<TcpSocket.Server | null>(null);
  const [zeroconf] = useState(() => new Zeroconf());
  const [clients, setClients] = useState<Map<string, TcpSocket.Socket>>(new Map());
  const [receivedMessages, setReceivedMessages] = useState<TVMessage[]>([]);

  const handleMessage = useCallback((message: TVMessage, socket: TcpSocket.Socket) => {
    switch (message.type) {
      case 'command': {
        const { command, params } = message.payload;
        console.info(`[TV Server] Executing command: ${command}`, params);

        // Send response
        socket.write(
          JSON.stringify({
            id: Crypto.randomUUID(),
            type: 'response',
            payload: {
              originalMessageId: message.id,
              status: 'success',
              command,
            },
            timestamp: new Date(),
            from: deviceInfo.id,
          }),
        );
        break;
      }
      case 'data':
        console.info('[TV Server] Received data:', message.payload);
        break;

      case 'heartbeat':
        console.info('[TV Server] Received heartbeat, sending response');
        socket.write(
          JSON.stringify({
            id: Crypto.randomUUID(),
            type: 'heartbeat',
            payload: { status: 'alive' },
            timestamp: new Date(),
            from: deviceInfo.id,
          }),
        );
        break;
      default:
        console.info('[TV Server] Received unknown message type:', message.type);
        break;
    }
  }, []);

  const publishTVService = useCallback(() => {
    try {
      zeroconf.publishService('react-native-tv', 'tcp', 'local.', deviceInfo.name, 9999, {
        platform: deviceInfo.platform,
        id: deviceInfo.id,
        capabilities: JSON.stringify(['video', 'audio', 'remote']),
      });
      console.info('TV Service published');
    } catch (error) {
      console.error('Error publishing service:', error);
    }
  }, [zeroconf]);

  const startTVServer = useCallback(() => {
    const tcpServer = TcpSocket.createServer(socket => {
      const socketId = Crypto.randomUUID();
      console.info(`[TV Server] Client connected: ${socketId}`);

      setClients(prev => new Map(prev).set(socketId, socket));

      console.info('[TV Server] Sending discover message...');
      socket.write(
        JSON.stringify({
          id: Crypto.randomUUID(),
          type: 'discover',
          payload: {
            ...deviceInfo,
            isLoggedIn: !!token,
          },
          timestamp: new Date(),
          from: deviceInfo.id,
        }),
      );

      socket.on('data', data => {
        try {
          console.info('[TV Server] Data received from client');
          const message: TVMessage = JSON.parse(data.toString());
          console.info('[TV Server] Parsed message:', message);
          setReceivedMessages(prev => [...prev, message]);
          handleMessage(message, socket);
        } catch (error) {
          console.error('[TV Server] Error parsing message:', error);
        }
      });

      socket.on('error', error => console.error('[TV Server] Socket error:', error));

      socket.on('end', () => {
        console.info(`[TV Server] Client ended connection: ${socketId}`);
      });

      socket.on('close', () => {
        console.info(`[TV Server] Client disconnected: ${socketId}`);
        setClients(prev => {
          const newClients = new Map(prev);
          newClients.delete(socketId);
          return newClients;
        });
      });
    });

    tcpServer.listen({ port: 9999, host: '0.0.0.0' }, () => {
      console.info('TV Server listening on port 9999');
      setServer(tcpServer);
      publishTVService();
    });

    return tcpServer;
  }, [handleMessage, publishTVService]);

  const stopTVServer = useCallback(() => {
    try {
      console.info('[TV Server] Stopping TV server...');
      zeroconf.unpublishService(deviceInfo.name);
      zeroconf.stop();
      server?.close();
      clients.forEach(client => client.destroy());
      console.info('[TV Server] TV server stopped');
    } catch (error) {
      console.error('[TV Server] Error stopping TV server:', error);
    }
  }, [clients, server, zeroconf]);

  useEffect(() => {
    console.info('[TV Server] useTVServer useEffect mounting');
    startTVServer();
    return () => {
      console.info('[TV Server] useTVServer useEffect unmounting');
      stopTVServer();
    };
  }, []);

  return { receivedMessages };
}
