import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
    // @ts-ignore
    window.Pusher = Pusher;

    const isSecure = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const configuredHost = import.meta.env.VITE_REVERB_HOST;
    const wsHost = (!isLocalhost && window.location.hostname)
        ? window.location.hostname
        : (configuredHost || 'localhost');

    // On production HTTPS, ALWAYS force TLS over port 443 through Nginx SSL proxy
    const forceTLS = isSecure || ((import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https');
    const wsPort = isSecure ? 443 : (Number(import.meta.env.VITE_REVERB_PORT) || 80);
    const wssPort = isSecure ? 443 : (Number(import.meta.env.VITE_REVERB_PORT) || 443);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // @ts-ignore
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'reverbkey123',
        wsHost: wsHost,
        wsPort: wsPort,
        wssPort: wssPort,
        forceTLS: forceTLS,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
        },
    });

    if (window.Echo?.connector?.pusher?.connection) {
        window.Echo.connector.pusher.connection.bind('connected', () => {
            console.log('[Echo] Connected to Reverb at', wsHost, forceTLS ? '(WSS/443)' : `(WS/${wsPort})`);
        });
        window.Echo.connector.pusher.connection.bind('error', (err: any) => {
            console.error('[Echo] Connection error:', err);
        });
        window.Echo.connector.pusher.connection.bind('state_change', (states: any) => {
            console.log('[Echo] State changed:', states.previous, '->', states.current);
        });
    }
}

