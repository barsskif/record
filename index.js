import Hapi from '@hapi/hapi';

import { mainRoute } from './routes/mainRoute/index.js';
import { SETINGS } from './setings.js';


// Создаем сервер Hapi
const server = Hapi.server({
    ...SETINGS.serverSeting
});


mainRoute(server)

// Запустить сервер Hapi
const start = async () => {
    await server.start();
};


start()
    .then(() => console.log('Server running on %s', server.info.uri))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });