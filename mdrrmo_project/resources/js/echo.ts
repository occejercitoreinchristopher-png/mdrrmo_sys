import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
    // @ts-ignore
    window.Pusher = Pusher;

    const configuredHost = import.meta.env.VITE_REVERB_HOST;
    const wsHost = (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost')
        ? window.location.hostname
        : (configuredHost || 'localhost');

    // @ts-ignore
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: wsHost,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });
}
