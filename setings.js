export const SETINGS = {
    serverSeting: {
        port: 3000,
        host: 'localhost',
        routes: {
            state: {
                parse: false,
                failAction: 'log'
            }
        }
    },
    puppeteerSeting: {
        headless: false,
        viewport: { width: 1920, height: 1080 }
    },
    // baseUrl: 'https://stream.verbatica.ai/'
    baseUrl: 'https://localhost:3001/'
}