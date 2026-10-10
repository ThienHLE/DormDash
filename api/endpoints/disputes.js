import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = express.Router();
const statuses = ['In Review', 'No Action', 'Resolved'];
const disputeSorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    statusAsc: { status: 1, createdAt: -1 },
    statusDesc: { status: -1, createdAt: -1 }
};
let disputeIndexPromise;
const validId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const reply = (res, statusCode, statusMessage, content = {}) =>
    res.status(statusCode).json({ statusCode, statusMessage, content });

async function getSessionUser(req) {
    if (!req.session.user?._id || !validId(String(req.session.user._id))) return null;
    return getDb().collection('users').findOne({
        _id: new ObjectId(String(req.session.user._id))
    });
}

async function requireLogin(req, res) {
    const user = await getSessionUser(req);
    if (user) return user;
    reply(res, 401, 'You must be logged in.');
    return null;
}

async function requireAdmin(req, res) {
    const user = await requireLogin(req, res);
    if (!user) return null;
    if (user.admin) return user;
    reply(res, 403, 'Admin access required.');
    return null;
}

// Lists disputes where the logged-in user is either person involved.
router.get('/', async (req, res) => {
    const user = await requireLogin(req, res);
    if (!user) return;

    const disputes = await getDb().collection('disputes')
        .find({
            $or: [
                { createdBy: user._id },
                { disputedUserId: user._id }
            ]
        })
        .sort({ createdAt: -1 })
        .toArray();

    return reply(res, 200, 'Disputes retrieved successfully.', { disputes });
});

// Lists all disputes for administrators, optionally filtered by status.
router.get('/listAll', async (req, res) => {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { status } = req.query;
    const sortBy = req.query.sortBy ?? 'newest';
    if (status !== undefined && !statuses.includes(status)) {
        return reply(res, 400, `Status must be one of: ${statuses.join(', ')}.`);
    }
    if (typeof sortBy !== 'string' || !Object.hasOwn(disputeSorts, sortBy)) {
        return reply(res, 400, 'Sort must be newest, oldest, statusAsc, or statusDesc.');
    }

    const disputes = await getDb().collection('disputes')
        .find(status === undefined ? {} : { status })
        .sort(disputeSorts[sortBy])
        .toArray();

    const postIds = disputes
        .map((dispute) => dispute.postId)
        .filter((postId) => postId && validId(String(postId)))
        .map((postId) => new ObjectId(String(postId)));
    const existingPostIds = postIds.length
        ? await getDb().collection('deliveries')
            .find({ _id: { $in: postIds } }, { projection: { _id: 1 } })
            .toArray()
        : [];
    const existingPostIdSet = new Set(existingPostIds.map((post) => String(post._id)));

    return reply(res, 200, 'Disputes retrieved successfully.', {
        disputes: disputes.map((dispute) => ({
            ...dispute,
            postExists: existingPostIdSet.has(String(dispute.postId))
        }))
    });
});

// Creates a dispute on behalf of the authenticated user.
router.post('/create', async (req, res) => {
    const user = await requireLogin(req, res);
    if (!user) return;

    const { postId, message } = req.body ?? {};
    if (!validId(postId)) return reply(res, 400, 'A valid postId is required.');
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 2000) {
        return reply(res, 400, 'A message of 1 to 2000 characters is required.');
    }

    const post = await getDb().collection('deliveries').findOne({
        _id: new ObjectId(postId)
    });
    if (!post) return reply(res, 404, 'Delivery post not found.');

    const isRequester = post.requesterId && String(post.requesterId) === String(user._id);
    const isCourier = post.courierId && String(post.courierId) === String(user._id);
    if (!isRequester && !isCourier) {
        return reply(res, 403, 'You must be involved in the delivery to report it.');
    }
    const disputedUserId = isRequester ? post.courierId : post.requesterId;
    if (!disputedUserId) {
        return reply(res, 409, 'This delivery has no other participant to report.');
    }
    if (!validId(String(disputedUserId))) {
        return reply(res, 409, 'The other participant has an invalid user ID.');
    }

    const disputedUser = await getDb().collection('users').findOne({
        _id: new ObjectId(String(disputedUserId))
    });
    if (!disputedUser) return reply(res, 404, 'Disputed user not found.');

    const disputes = getDb().collection('disputes');
    if (await disputes.findOne({ postId: post._id, createdBy: user._id })) {
        return reply(res, 409, 'You have already reported this delivery.');
    }

    disputeIndexPromise ??= disputes.createIndex(
        { postId: 1, createdBy: 1 },
        { unique: true, name: 'unique_dispute_per_post_and_creator' }
    );
    try {
        await disputeIndexPromise;
    } catch (error) {
        disputeIndexPromise = undefined;
        throw error;
    }

    const now = new Date();
    const dispute = {
        postId: post._id,
        createdBy: user._id,
        createdByRole: user.admin ? 'admin' : 'student',
        disputedUserId: disputedUser._id,
        disputedUserRole: disputedUser.admin ? 'admin' : 'student',
        message: message.trim(),
        status: 'In Review',
        createdAt: now,
        updatedAt: now
    };
    let insertedId;
    try {
        ({ insertedId } = await disputes.insertOne(dispute));
    } catch (error) {
        if (error.code === 11000) {
            return reply(res, 409, 'You have already reported this delivery.');
        }
        throw error;
    }

    return reply(res, 201, 'Dispute created successfully.', {
        dispute: { _id: insertedId, ...dispute }
    });
});

// Updates a dispute's status; only administrators may handle disputes.
router.put('/updateStatus/:id', async (req, res) => {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (!validId(req.params.id)) return reply(res, 400, 'Invalid dispute ID.');
    const { status } = req.body ?? {};
    if (!statuses.includes(status)) {
        return reply(res, 400, `Status must be one of: ${statuses.join(', ')}.`);
    }

    const dispute = await getDb().collection('disputes').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: 'after', includeResultMetadata: false }
    );
    if (!dispute) return reply(res, 404, 'Dispute not found.');

    return reply(res, 200, 'Dispute status updated successfully.', { dispute });
});

// Deletes the delivery post linked to a dispute; only administrators may do this.
router.delete('/:id/post', async (req, res) => {
    const user = await requireAdmin(req, res);
    if (!user) return;
    if (!validId(req.params.id)) return reply(res, 400, 'Invalid dispute ID.');

    const dispute = await getDb().collection('disputes').findOne({
        _id: new ObjectId(req.params.id)
    });
    if (!dispute) return reply(res, 404, 'Dispute not found.');
    if (!dispute.postId || !validId(String(dispute.postId))) {
        return reply(res, 409, 'Dispute has no valid linked delivery post.');
    }

    const result = await getDb().collection('deliveries').deleteOne({
        _id: new ObjectId(String(dispute.postId))
    });
    if (result.deletedCount === 0) return reply(res, 404, 'Delivery post not found.');
    return reply(res, 200, 'Delivery post deleted successfully.', {
        postId: dispute.postId
    });
});

router.use((err, _req, res, _next) => {
    console.error('Failed to process dispute request:', err);
    return reply(res, 500, 'Unable to process dispute request.');
});

export default router;
