import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js';
import api, { getToken } from '../services/api.js';
import { getNotifications, getUnreadMessageCount, markAllNotificationsRead, markNotificationRead } from '../services/chatService.js';

export const RealtimeContext = createContext(null);

// The socket server lives at the same address as the API, without the "/api" part.
const socketUrl = () => new URL(api.defaults.baseURL, window.location.origin).origin;

// Keeps one Socket.IO connection open while someone is logged in, and holds the live numbers for the top bar:
// notifications, the unread message count, and the pop-up toast.
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [toast, setToast] = useState(null);
  const activeChat = useRef(null); // id of the chat that is open right now, if any
  const toastTimer = useRef(null);
  const canChat = user && user.role !== 'admin';

  const showToast = useCallback((t) => {
    setToast({ ...t, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const refreshUnreadMessages = useCallback(() => {
    if (!canChat) return;
    getUnreadMessageCount().then((b) => setUnreadMessages(b.data.count)).catch(() => {});
  }, [canChat]);

  useEffect(() => {
    if (!user) {
      setSocket(null); setConnected(false); setNotifications([]); setUnreadNotifications(0); setUnreadMessages(0); setToast(null);
      return undefined;
    }

    // Numbers from the server first, then the live connection keeps them current.
    getNotifications().then((b) => { setNotifications(b.data.items); setUnreadNotifications(b.data.unread); }).catch(() => {});
    refreshUnreadMessages();

    const s = io(socketUrl(), { auth: { token: getToken() }, transports: ['websocket'] });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('notification', (n) => {
      setNotifications((list) => [n, ...list].slice(0, 20));
      setUnreadNotifications((c) => c + 1);
      showToast({ title: n.title, body: n.body, link: n.link });
    });
    s.on('message:new', (m) => {
      if (m.sender === user.id) return; // my own message, sent from another tab
      if (activeChat.current === m.conversation) return; // I am looking at it; the chat page handles it
      setUnreadMessages((c) => c + 1);
      showToast({ title: 'New message', body: m.text.slice(0, 80), link: `/messages/${m.conversation}` });
    });
    setSocket(s);
    return () => { s.close(); clearTimeout(toastTimer.current); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const readNotification = useCallback(async (n) => {
    if (n.readAt) return;
    setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x)));
    setUnreadNotifications((c) => Math.max(0, c - 1));
    try { await markNotificationRead(n._id); } catch { /* the badge fixes itself on the next load */ }
  }, []);

  const readAllNotifications = useCallback(async () => {
    setNotifications((list) => list.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
    setUnreadNotifications(0);
    try { await markAllNotificationsRead(); } catch { /* ignore */ }
  }, []);

  const value = useMemo(
    () => ({
      socket, connected, notifications, unreadNotifications, unreadMessages, toast,
      dismissToast: () => setToast(null),
      setActiveChat: (id) => { activeChat.current = id; },
      refreshUnreadMessages, readNotification, readAllNotifications,
    }),
    [socket, connected, notifications, unreadNotifications, unreadMessages, toast, refreshUnreadMessages, readNotification, readAllNotifications]
  );
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
