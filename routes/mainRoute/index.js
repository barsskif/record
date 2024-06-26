import puppeteer from 'puppeteer';
import { SETINGS } from '../../setings.js';



// Объекты для хранения экземпляров браузера и страниц
let browsers = {};
let pages = {};

const launchPuppeteer = async (id) => {
    // Запускаем новый экземпляр браузера
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--allow-insecure-localhost',
            '--enable-usermedia-screen-capturing',
            '--use-fake-ui-for-media-stream', // In headless: false it will capture display rather than tab and in headless: true doesn't work
            '--auto-select-desktop-capture-source=[RECORD]', //[RECORD] is the title of my localhost page trying to screen capture
            '--remote-debugging-port=9222',
            '--window-size=1440,900',
        ],
        ignoreDefaultArgs: [
            '--mute-audio',
            '--disable-media-session-api',
        ]
    });
    const page = await browser.newPage();
    await page.setViewport(SETINGS.puppeteerSeting.viewport);

    // Сохраняем браузер и страницу в объекты, используя предоставленный ID
    browsers[id] = browser;
    pages[id] = page;

    return { browser, page };
};

export const mainRoute = (server) => {
    server.route({
        method: 'GET',
        path: '/startRecording/{idRoom}',
        handler: async (request, h) => {
            const { idRoom } = request.params;

            // Проверяем, существует ли уже браузер для данного ID
            if (browsers[idRoom]) {
                // Если существует, просто возвращаем с статусом "running"
                console.log(`Браузер для id=${idRoom} уже запущен.`);
                return { status: 'success', recording_in_progress: 'running', roomID: idRoom };
            }

            const { page } = await launchPuppeteer(idRoom);

            await page.goto(SETINGS.baseUrl);

            const title = await page.title();


            console.log(`The title of this web page is "${title}".`);

            await page.addScriptTag({ url: 'https://cdn.socket.io/4.0.0/socket.io.min.js' });

            page.evaluate(async () => {
                document.title = 'Video chat'


                const ws = io('http://localhost:3000/mediasoup', {
                    transports: ['websocket'],
                });
                // const ws = io('wss://video.verbatica.ai/mediasoup');


                ws.on('connection-success', async ({ socketId }) => {
                    console.log(socketId);

                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: true, // Захват видео
                    });

                    const mediaRecorder = new MediaRecorder(stream); // 'stream' получен через navigator.mediaDevices.getUserMedia
                    mediaRecorder.ondataavailable = function (event) {
                        if (event.data.size > 0) {
                            ws.emit('record', event.data);
                        }
                    };
                    mediaRecorder.start(1000)



                    // getLocalStream();
                });

            })



            return {
                status: 'success',
                message: `recording started on ${idRoom}`,
                roomID: idRoom,
                recording_in_progress: 'started',
            };
        }
    });


    server.route({
        method: 'GET',
        path: '/stopRecording/{idRoom}',
        handler: async (request, h) => {
            const { idRoom } = request.params;

            await browsers[idRoom].close();
            delete browsers[idRoom];
            delete pages[idRoom];

            console.log(`browser closed "${idRoom}".`);

            return {
                status: 'success',
                message: `recording stopped on ${idRoom}`,
            };
        }
    });
};

