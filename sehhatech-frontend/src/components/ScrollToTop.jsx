import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top every time the route changes.
 * React Router does NOT do this automatically — without it, navigating
 * to a new page keeps the previous scroll position (e.g. clicking a
 * footer link while scrolled down lands you at the bottom of the new page).
 *
 * Usage: render this once, anywhere inside <BrowserRouter>, e.g. right
 * after it opens, alongside your <Routes>. It renders nothing itself.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}