import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { readdirSync } from 'fs';
import { connectDb, closeDb, getClient } from './db.js';

export async function createApp({ sessionStore } = {}) {
    const app = express();
    app.use(express.json());
    // Allows Express to read JSON request bodies.
    app.use(express.json());

    // Configures session-based authentication.
    app.use(session({
        secret: process.env.SESSION_SECRET ?? 'dormdrop-dev-secret',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
    }));
    app.get('/', (_req, res) => {
        res.send('Welcome to DormDash API');
    });

    for (const file of readdirSync(new URL('./endpoints', import.meta.url))) {
        if (!file.endsWith('.js')) continue;
        const { default: router } = await import(`./endpoints/${file}`);
        app.use(`/api/v1/${file.replace('.js', '')}`, router);
    }

    return app;
}

if (process.env.NODE_ENV !== 'test') {
    await connectDb();
    console.log('Connected to MongoDB');

    const app = await createApp({ sessionStore: MongoStore.create({ client: getClient(), dbName: 'dormdash' }) });
    const port = process.env.PORT ?? 3000;
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    for (const signal of ['SIGTERM', 'SIGINT']) {
        process.on(signal, async () => {
            console.log(`${signal} received, shutting down`);
            server.close();
            await closeDb();
        });
    }
}