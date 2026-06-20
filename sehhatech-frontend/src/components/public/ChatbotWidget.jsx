import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axios";

const STORAGE_KEY = "sehhatech_chat_history";

const quickReplySets = {
    initial: [
        { label: "Features ✨", text: "What features does SehhaTech offer?" },
        { label: "السعر 💰", text: "كم سعر الاشتراك؟" },
        { label: "Get Started 🚀", text: "How do I register my clinic?" },
    ],
    afterFeatures: [
        { label: "Pricing? 💰", text: "How much does it cost?" },
        { label: "للأطباء 👨‍⚕️", text: "إيه المميزات للأطباء؟" },
        { label: "Security? 🔒", text: "How secure is my data?" },
    ],
    afterPricing: [
        { label: "Register now 🚀", text: "How do I sign up?" },
        { label: "Trial? 🎁", text: "Is there a free trial?" },
        { label: "المميزات ✨", text: "إيه مميزات النظام؟" },
    ],
    afterRegister: [
        { label: "Features ✨", text: "What can I do after registering?" },
        { label: "Support? 🤝", text: "Do you offer customer support?" },
        { label: "الأدوار 👥", text: "إيه الأدوار المتاحة في النظام؟" },
    ],
};

const WELCOME_MESSAGE =
    "👋 Hi! / أهلاً!\nI'm SehhaTech's AI assistant.\nأنا مساعد SehhaTech الذكي 😊\n\nAsk me anything! / اسألني أي حاجة!";

function detectIntent(text) {
    const t = text.toLowerCase();
    if (t.includes("feature") || t.includes("مميز") || t.includes("يعمل"))
        return "afterFeatures";
    if (
        t.includes("price") ||
        t.includes("cost") ||
        t.includes("سعر") ||
        t.includes("اشتراك")
    )
        return "afterPricing";
    if (
        t.includes("register") ||
        t.includes("start") ||
        t.includes("sign") ||
        t.includes("اشترك") ||
        t.includes("تسجيل")
    )
        return "afterRegister";
    return null;
}

function shouldShowCTA(text) {
    const t = text.toLowerCase();
    return (
        t.includes("register") ||
        t.includes("sign up") ||
        t.includes("get start") ||
        t.includes("اشترك") ||
        t.includes("تسجيل") ||
        t.includes("ابدأ")
    );
}

function formatText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

function loadHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [messages, setMessages] = useState(() => {
        const history = loadHistory();
        if (history.length > 0) {
            return history.map((h) => ({
                role: h.role === "model" ? "bot" : "user",
                text: h.text,
                time: "",
                showCTA: false,
            }));
        }
        return [{ role: "bot", text: WELCOME_MESSAGE, time: "", showCTA: false }];
    });
    const [history, setHistory] = useState(loadHistory());
    const [quickReplies, setQuickReplies] = useState(quickReplySets.initial);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) setHasUnread(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const openHandler = () => {
            setIsOpen(true);
            setHasUnread(false);
        };
        window.addEventListener("sehhatech:open-chat", openHandler);
        return () => window.removeEventListener("sehhatech:open-chat", openHandler);
    }, []);

    const toggleChat = () => {
        setIsOpen((prev) => !prev);
        setHasUnread(false);
    };

    const clearHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        setHistory([]);
        setMessages([
            { role: "bot", text: WELCOME_MESSAGE, time: "", showCTA: false },
        ]);
        setQuickReplies(quickReplySets.initial);
    };

    const handleSend = async (textOverride) => {
        const text = (textOverride ?? input).trim();
        if (!text || isLoading) return;

        setInput("");
        setIsLoading(true);

        const time = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        setMessages((prev) => [
            ...prev,
            { role: "user", text, time, showCTA: false },
        ]);

        const intent = detectIntent(text);
        if (intent) setQuickReplies(quickReplySets[intent]);

        const newHistory = [...history, { role: "user", text }];

        try {
            const res = await axiosInstance.post("/api/ChatBot/ask", {
                message: text,
                history: newHistory.slice(-10),
            });

            const data = res.data;
            const reply = data.success
                ? data.reply
                : "Sorry, something went wrong. / عذراً، حدث خطأ.";

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    text: reply,
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    showCTA: shouldShowCTA(text),
                },
            ]);

            if (data.success) {
                const updatedHistory = [...newHistory, { role: "model", text: reply }];
                setHistory(updatedHistory);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    text: "Connection error. / خطأ في الاتصال.",
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    showCTA: false,
                },
            ]);
        }

        setIsLoading(false);
    };

    return (
        <>
            <button
                className="chatbot-toggle"
                onClick={toggleChat}
                aria-label="Open chat assistant"
            >
                <span className="chatbot-toggle__pulse" />
                {!isOpen ? (
                    <svg
                        className="chatbot-toggle__icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                ) : (
                    <svg
                        className="chatbot-toggle__icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                    </svg>
                )}
                {hasUnread && !isOpen && (
                    <span className="chatbot-toggle__badge">1</span>
                )}
            </button>

            <div
                className={`chatbot-window ${isOpen ? "chatbot-window--open" : "chatbot-window--closed"
                    }`}
            >
                <div className="chatbot-window__header">
                    <div className="chatbot-window__avatar">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="11" width="18" height="10" rx="2" />
                            <circle cx="12" cy="5" r="2" />
                            <path d="M12 7v4" />
                            <line x1="8" y1="16" x2="8" y2="16" />
                            <line x1="16" y1="16" x2="16" y2="16" />
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p className="chatbot-window__title">SehhaTech Assistant</p>
                        <div className="chatbot-window__status">
                            <span className="chatbot-window__status-dot" />
                            <p className="chatbot-window__status-text">
                                Online · Replies instantly
                            </p>
                        </div>
                    </div>
                    <button
                        className="chatbot-window__action"
                        onClick={clearHistory}
                        title="Clear chat"
                        aria-label="Clear chat"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
                            <path d="M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                    </button>
                    <button
                        className="chatbot-window__action"
                        onClick={toggleChat}
                        aria-label="Close chat"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="chatbot-window__messages">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`chatbot-message chatbot-message--${msg.role} chatbot-message--in`}
                        >
                            {msg.role === "bot" && (
                                <div className="chatbot-message__avatar">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="11" width="18" height="10" rx="2" />
                                        <circle cx="12" cy="5" r="2" />
                                        <path d="M12 7v4" />
                                    </svg>
                                </div>
                            )}
                            <div className="chatbot-message__bubble">
                                <p
                                    dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                                />
                                {msg.showCTA && (
                                    <Link to="/register" className="chatbot-cta">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
                                            <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
                                        </svg>
                                        Register Now — 500 EGP/year
                                    </Link>
                                )}
                                {msg.time && (
                                    <p className="chatbot-message__time">{msg.time}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chatbot-message chatbot-message--bot">
                            <div className="chatbot-message__avatar">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                    <circle cx="12" cy="5" r="2" />
                                    <path d="M12 7v4" />
                                </svg>
                            </div>
                            <div className="chatbot-message__bubble">
                                <div className="chatbot-typing">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-quick-replies">
                    {quickReplies.map((reply) => (
                        <button
                            key={reply.label}
                            className="chatbot-quick-reply"
                            onClick={() => handleSend(reply.text)}
                        >
                            {reply.label}
                        </button>
                    ))}
                </div>

                <div className="chatbot-window__input-row">
                    <input
                        type="text"
                        className="chatbot-window__input"
                        placeholder="Ask anything... / اسأل أي حاجة..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                    />
                    <button
                        className="chatbot-window__send"
                        onClick={() => handleSend()}
                        disabled={isLoading}
                        aria-label="Send message"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
}