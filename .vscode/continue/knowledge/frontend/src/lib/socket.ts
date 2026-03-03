// socket.ts
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/config/sourceConfig';



// Define the shape of your socket events (optional, for stronger typing)
interface ServerToClientEvents {
    message: (data: string) => void;
}

interface ClientToServerEvents {
    message: (data: string) => void; // You are emitting this
    joinRoom: (data: { roomId: string }) => void;
}

// "undefined" means the URL will be computed from the window.location object

export const socket: Socket = io(API_URL, {
    autoConnect: true, // or false if you want to control when to connect
});