import 'dotenv/config';
import express from 'express';
import { readdirSync } from 'fs';
import { connectDb, closeDb } from './db.js';

export async function createApp() {
    const app = express();
    app.use(express.json());

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

    const app = await createApp();
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