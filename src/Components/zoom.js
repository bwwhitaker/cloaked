// Browser zoom (Ctrl/Cmd and +), as a multiplier: 1 is 100%, 2 is 200%.
//
// Zooming shrinks the window as far as CSS is concerned, but nothing in the page
// says so directly. On desktop the browser window keeps its real width
// (outerWidth) while the page's width in CSS pixels (innerWidth) shrinks by the
// zoom factor, so the ratio of the two is the zoom. Phones report the same
// number for both, so they read as 1 (pinch-zoom is a separate thing and does
// not change either).
export const ZOOM_SCROLL_THRESHOLD = 1.1;

export function browserZoom() {
	const { outerWidth, innerWidth } = window;
	if (!outerWidth || !innerWidth) return 1;
	return Math.max(1, outerWidth / innerWidth);
}

// Past 110% the page scrolls in both directions instead of being fitted to the window.
export const isZoomedIn = () => browserZoom() > ZOOM_SCROLL_THRESHOLD;
