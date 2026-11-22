import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, LoaderCircle, MessageSquare, Send } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useRealtime } from '../hooks/useRealtime.js';
import { getErrorMessage } from '../services/api.js';
import { getConversations, getMessages, markConversationRead, sendMessage } from '../services/chatService.js';
import { formatAgo } from '../utils/format.js';

const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function Avatar({ name }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{(name || '?')[0].toUpperCase()}</span>;
}

// Two panes on a laptop (list and chat). On a phone only one shows at a time.
export default function Messages() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, setActiveChat, refreshUnreadMessages } = useRealtime();
  const navigate = useNavigate();

  const [convs, setConvs] = useState(null);
  const [listError, setListError] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);
  const idRef = useRef(id);
  idRef.current = id;

  const loadList = useCallback(() => getConversations().then((b) => { setConvs(b.data); setListError(''); }).catch((e) => setListError(getErrorMessage(e))), []);
  useEffect(() => { loadList(); }, [loadList]);

  // Open a chat: load messages, mark them read, and tell the top bar which chat is open.
  useEffect(() => {
    setActiveChat(id || null);
    if (!id) { setMessages([]); return undefined; }
    let cancelled = false;
    setLoadingChat(true); setChatError('');
    getMessages(id)
      .then(async (b) => {
        if (cancelled) return;
        setMessages(b.data); setHasMore(b.data.length >= 30);
        await markConversationRead(id).catch(() => {});
        setConvs((list) => list && list.map((c) => (c._id === id ? { ...c, unread: 0 } : c)));
        refreshUnreadMessages();
      })
      .catch((e) => !cancelled && setChatError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoadingChat(false));
    return () => { cancelled = true; setActiveChat(null); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live events.
  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = (m) => {
      const open = idRef.current === m.conversation;
      if (open) {
        setMessages((list) => (list.some((x) => x._id === m._id) ? list : [...list, m]));
        if (m.sender !== user.id) markConversationRead(m.conversation).then(refreshUnreadMessages).catch(() => {});
      }
      setConvs((list) => {
        if (!list || !list.some((c) => c._id === m.conversation)) { loadList(); return list; } // a brand new chat
        const updated = list.map((c) => (c._id === m.conversation
          ? { ...c, lastMessage: m.text.slice(0, 100), lastMessageAt: m.createdAt, unread: !open && m.sender !== user.id ? c.unread + 1 : c.unread }
          : c));
        return [...updated].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };
    const onRead = ({ conversation }) => {
      if (idRef.current === conversation) setMessages((list) => list.map((m) => (m.sender === user.id && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)));
    };
    socket.on('message:new', onMessage);
    socket.on('conversation:read', onRead);
    return () => { socket.off('message:new', onMessage); socket.off('conversation:read', onRead); };
  }, [socket, user.id, loadList, refreshUnreadMessages]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages.length, id]);

  async function loadEarlier() {
    const body = await getMessages(id, messages[0].createdAt).catch(() => null);
    if (!body) return;
    setMessages((list) => [...body.data, ...list]);
    setHasMore(body.data.length >= 30);
  }

  async function handleSend(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true); setChatError('');
    try {
      const body = await sendMessage(id, value);
      setText('');
      setMessages((list) => (list.some((x) => x._id === body.data._id) ? list : [...list, body.data]));
    } catch (err) {
      setChatError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const current = convs?.find((c) => c._id === id);

  return (
    <div className="card grid h-[calc(100vh-9rem)] min-h-[420px] overflow-hidden lg:grid-cols-[320px_1fr]">
      {/* conversation list */}
      <aside className={`flex min-h-0 flex-col border-brand-50 lg:border-r ${id ? 'hidden lg:flex' : 'flex'}`}>
        <h2 className="border-b border-brand-50 px-5 py-4 text-lg font-semibold">Messages</h2>
        {listError && <div className="p-4"><ErrorMessage message={listError} onRetry={loadList} /></div>}
        {!convs && !listError && <Loader />}
        {convs?.length === 0 && (
          <p className="p-6 text-sm text-muted">No conversations yet. {user.role === 'customer' ? 'Open a provider\'s page and press Message to start one.' : 'When a customer messages you, it will show up here.'}</p>
        )}
        <ul className="flex-1 overflow-y-auto">
          {convs?.map((c) => (
            <li key={c._id}>
              <Link to={`/messages/${c._id}`} className={`flex items-center gap-3 border-b border-brand-50 px-5 py-3 hover:bg-brand-50 ${c._id === id ? 'bg-brand-50' : ''}`}>
                <Avatar name={c.other.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{c.other.name}</span>
                    {c.lastMessage && <span className="shrink-0 text-[11px] text-muted">{formatAgo(c.lastMessageAt)}</span>}
                  </span>
                  <span className={`block truncate text-sm ${c.unread ? 'font-medium text-ink' : 'text-muted'}`}>{c.lastMessage || 'No messages yet'}</span>
                </span>
                {c.unread > 0 && <span data-testid="unread-chip" className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">{c.unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* chat */}
      <section className={`min-h-0 flex-col ${id ? 'flex' : 'hidden lg:flex'}`}>
        {!id ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-muted">
            <div><MessageSquare size={36} className="mx-auto mb-3 text-brand-300" /><p>Select a conversation to start chatting.</p></div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-brand-50 px-4 py-3">
              <button onClick={() => navigate('/messages')} aria-label="Back to conversations" className="icon-btn lg:hidden"><ArrowLeft size={18} /></button>
              <Avatar name={current?.other.name} />
              <h3 className="font-semibold">{current?.other.name || 'Conversation'}</h3>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto bg-page/50 p-4" aria-live="polite">
              {loadingChat && <Loader />}
              {hasMore && !loadingChat && <button onClick={loadEarlier} className="mx-auto block text-sm font-medium text-brand-600 hover:underline">Load earlier messages</button>}
              {!loadingChat && messages.length === 0 && !chatError && <p className="py-10 text-center text-sm text-muted">Say hello. Messages are delivered instantly.</p>}
              {messages.map((m) => {
                const mine = m.sender === user.id;
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div data-testid={mine ? 'msg-mine' : 'msg-theirs'} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? 'rounded-br-sm bg-brand-700 text-white' : 'rounded-bl-sm bg-white shadow-sm'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                        {timeOf(m.createdAt)}
                        {mine && (m.readAt ? <CheckCheck size={12} aria-label="Seen" /> : <Check size={12} aria-label="Sent" />)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>

            {chatError && <div className="px-4 pt-2"><ErrorMessage message={chatError} /></div>}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-brand-50 p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Type a message..." aria-label="Message" className="field flex-1 rounded-full px-4" />
              <button type="submit" disabled={sending || !text.trim()} aria-label="Send" className="btn-primary h-10 w-10 !p-0">
                {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
