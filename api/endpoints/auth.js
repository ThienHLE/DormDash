import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
const router = express.Router();

function sessionUser({ passwordHash, ...user }) {
    return user;
}

router.post("/signup", async (req, res) => {
    const { email, password, firstName, lastName } = req.body ?? {};
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ statusCode: 400, statusMessage: "Bad Request", content: { message: "Email, password, first name and last name are required" } });
    }

    const users = getDb().collection('users');
    if (await users.findOne({ email })) {
        return res.status(409).json({ statusCode: 409, statusMessage: "Conflict", content: { message: "Email already in use" } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const user = {
        email,
        passwordHash,
        firstName,
        lastName,
        admin: false,
        verified: false,
        createdAt: now,
        updatedAt: now
    };
    const { insertedId } = await users.insertOne(user);

    req.session.user = sessionUser({ ...user, _id: insertedId });
    res.status(201).json({ statusCode: 201, statusMessage: "Created", content: { user: req.session.user } });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = await getDb().collection('users').findOne({ email });

    if (!user || !(await bcrypt.compare(password ?? '', user.passwordHash))) {
        return res.status(401).json({ statusCode: 401, statusMessage: "Unauthorized", content: { message: "Invalid email or password" } });
    }

    req.session.user = sessionUser(user);
    res.json({ statusCode: 200, statusMessage: "OK", content: { user: req.session.user } });
});

router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ statusCode: 200, statusMessage: "OK", content: { message: "Logged out" } });
    });
});

router.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ statusCode: 401, statusMessage: "Unauthorized", content: { message: "Not logged in" } });
    }
    res.json({ statusCode: 200, statusMessage: "OK", content: { user: req.session.user } });
});

export default router;