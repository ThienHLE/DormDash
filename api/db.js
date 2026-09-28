import { MongoClient } from 'mongodb';

let client;
let db;

export async function connectDb() {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('dormdash');
}

export function getDb() {
    return db;
}

export async function closeDb() {
    await client?.close();
}