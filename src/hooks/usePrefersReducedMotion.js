import { useEffect, useState } from "react";
const QUERY = "(prefers-reduced-motion: reduce)";
/**
 * Subscribed, not read once - the existing check in SmoothScroll.jsx samples the
 * value at mount and never updates, so toggling the OS setting leaves the page
 * in the wrong mode until reload.
 */
export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia(QUERY).matches);
    useEffect(() => {
        const mql = window.matchMedia(QUERY);
        const onChange = (e) => setReduced(e.matches);
        mql.addEventListener("change", onChange);
        setReduced(mql.matches);
        return () => mql.removeEventListener("change", onChange);
    }, []);
    return reduced;
}
