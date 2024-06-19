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
            `--window-size=1920,1080`,
            '--enable-experimental-web-platform-features',
            '--disable-infobars',
            '--enable-usermedia-screen-capturing',
            '--allow-http-screen-capture',
            '--auto-select-desktop-capture-source=webclip',
            '--ignore-certificate-errors',
            '--unsafely-treat-insecure-origin-as-secure=' + SETINGS.baseUrl
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

            page.evaluate(async () => {
                document.title = 'Video chat'
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    mandatory: {
                        chromeMediaSource: 'tab',
                    }
                })
                const recorder = new window.MediaRecorder(stream, { mimeType: 'video/webm' })
                recorder.start(10)
                const chunks = []
                recorder.addEventListener('dataavailable', event => {
                    if (event.data && event.data.size) {
                        chunks.push(event.data)
                    }
                })

                console.log(chunks)
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
