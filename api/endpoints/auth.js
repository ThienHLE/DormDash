import express from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
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
    const user = {email, passwordHash, firstName, lastName, admin: false, verified: false, createdAt: now, updatedAt: now};
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

function error(res, code, statusMessage, message) {
    return res.status(code).json({ statusCode: code, statusMessage, content: { message } });
}

function requireLogin(req, res, next) {
    if (!req.session.user) return error(res, 401, "Unauthorized", "Not logged in");
    next();
}

const publicProjection = { passwordHash: 0 };

router.get("/user/:id", requireLogin, async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return error(res, 400, "Bad Request", "User ID must be a valid MongoDB ObjectId");
    const user = await getDb().collection('users').findOne({ _id: new ObjectId(req.params.id) }, { projection: publicProjection });
    if (!user) return error(res, 404, "Not Found", "User not found");
    res.json({ statusCode: 200, statusMessage: "OK", content: { user: sessionUser(user) } });
});

router.get("/getUsers", requireLogin, async (_req, res) => {
    const users = await getDb().collection('users').find({}, { projection: publicProjection }).toArray();
    res.json({ statusCode: 200, statusMessage: "OK", content: { users: users.map(sessionUser) } });
});

router.patch("/update", requireLogin, async (req, res) => {
    const { email, password, firstName, lastName } = req.body ?? {};
    const changes = {};
    if (firstName !== undefined) changes.firstName = firstName;
    if (lastName !== undefined) changes.lastName = lastName;
    if (email !== undefined) changes.email = email;
    if (password !== undefined) changes.passwordHash = await bcrypt.hash(password, 10);
    if (Object.values(changes).some((value) => value === '' || value === null)) return error(res, 400, "Bad Request", "Fields cannot be empty");
    if (!Object.keys(changes).length) return error(res, 400, "Bad Request", "Provide at least one of email, password, firstName or lastName");
    const users = getDb().collection('users');
    const _id = new ObjectId(req.session.user._id);
    if (changes.email && await users.findOne({ email: changes.email, _id: { $ne: _id } })) return error(res, 409, "Conflict", "Email already in use");
    const updated = await users.findOneAndUpdate({ _id }, {$set: { ...changes, updatedAt: new Date()}}, {returnDocument: 'after'});
    if (!updated) return error(res, 404, "Not Found", "User not found");
    req.session.user = sessionUser(updated);
    res.json({ statusCode: 200, statusMessage: "OK", content: { user: req.session.user } });
});

router.patch("/verifyUser/:id", requireLogin, async (req, res) => {
    const users = getDb().collection('users');
    const requester = await users.findOne({ _id: new ObjectId(req.session.user._id) });
    if (!requester?.admin) return error(res, 403, "Forbidden", "Admin access required");
    if (!ObjectId.isValid(req.params.id)) return error(res, 400, "Bad Request", "User ID must be a valid MongoDB ObjectId");
    const updated = await users.findOneAndUpdate({ _id: new ObjectId(req.params.id) }, {$set: {verified: true, updatedAt: new Date()}}, {returnDocument: 'after', projection: publicProjection});
    if (!updated) return error(res, 404, "Not Found", "User not found");
    res.json({ statusCode: 200, statusMessage: "OK", content: { user: sessionUser(updated) } });
});

router.patch("/unverifyUser/:id", requireLogin, async (req, res) => {
    const users = getDb().collection('users');
    const requester = await users.findOne({ _id: new ObjectId(req.session.user._id) });
    if (!requester?.admin) return error(res, 403, "Forbidden", "Admin access required");
    if (!ObjectId.isValid(req.params.id)) return error(res, 400, "Bad Request", "User ID must be a valid MongoDB ObjectId");
    const updated = await users.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: { verified: false, updatedAt: new Date() } },
        { returnDocument: 'after', projection: publicProjection }
    );
    if (!updated) return error(res, 404, "Not Found", "User not found");
    res.json({ statusCode: 200, statusMessage: "OK", content: { user: sessionUser(updated) } });
});

export default router;