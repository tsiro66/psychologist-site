I'm using Astro with ClientRouter (View Transitions).

I have a Google Maps component that works perfectly on a fresh page load, but when I navigate between pages using Astro's client router, the Google Maps markers/icons become corrupted (generic colored circles instead of the correct icons).

I want you to fix the integration so Google Maps works correctly after client-side navigation.

Requirements:

- Find every Google Maps component and initialization code.
- Check if the map is initialized only once.
- Make it compatible with Astro ClientRouter.
- Properly clean up the map when leaving the page.
- Reinitialize the map when Astro finishes a client-side navigation.
- Use Astro lifecycle events (`astro:page-load`, `astro:after-swap`, etc.) where appropriate.
- Prevent duplicate script loading.
- Prevent duplicate event listeners.
- Prevent multiple map instances.
- Ensure markers are recreated after navigation.
- If MarkerClusterer is used, recreate it as well.
- If AdvancedMarkerElement is used, recreate every marker after navigation.
- Make initialization idempotent so it can safely run multiple times.

Specifically verify:
- Google Maps JS script loads only once.
- Old map instances are disposed.
- Marker arrays are cleared before recreation.
- Event listeners are removed on cleanup.
- The map container is recreated correctly after page swaps.

The end result should behave identically whether the page is opened directly or reached through Astro client-side navigation.

Please explain the root cause before making changes.