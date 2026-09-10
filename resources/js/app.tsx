import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'Instituto Azon Social';

void createInertiaApp({
    title: (title) => title || appName,
    progress: {
        color: '#c8892c',
    },
});
