const icons = {
    image: (
        <path d="M3 3h18v18H3V3zm5 4a2 2 0 100 4 2 2 0 000-4zm-3 12l4-5 3 3 5-7 4 9H5z" />
    ),
    lock: (
        <path d="M12 1a5 5 0 00-5 5v3H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-2V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9zm3 4a2 2 0 110 4 2 2 0 010-4z" />
    ),
    dashboard: (
        <path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5z" />
    ),
    team: (
        <path d="M16 11a4 4 0 10-4-4 4 4 0 004 4zm-8 0a3 3 0 10-3-3 3 3 0 003 3zm8 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm-8 1.07A8.4 8.4 0 005 14c-2.5 0-5 1.17-5 3v3h6v-2.9c0-1.07.41-2.07 1.1-2.93A6.6 6.6 0 008 14.07z" />
    ),
};

export default function PlaceholderImage({
    icon = "image",
    label,
    className = "",
    aspect,
}) {
    return (
        <div
            className={`placeholder-image ${className}`}
            style={aspect ? { aspectRatio: aspect } : undefined}
        >
            <svg
                className="placeholder-image__icon"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                {icons[icon] || icons.image}
            </svg>
            {label && <span className="placeholder-image__label">{label}</span>}
        </div>
    );
}