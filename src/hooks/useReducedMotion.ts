import { useEffect, useState } from "react";

export function useReducedMotion() {
    const [reducedMotion, setReducedMotion] = useState(() => {
        return (
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        );
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );

        const handleChange = (event: MediaQueryListEvent) => {
            setReducedMotion(event.matches);
        };

        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    return reducedMotion;
}
