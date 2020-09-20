const { MongoClient, ObjectID } = require('mongodb');
const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const fetch = require('node-fetch');

const SECRET_KEY = process.env.SECRET_KEY;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const message = {
    attachment: {
        type: "template",
        payload: {
            template_type: "generic",
            elements: [{
                title: '',
                subtitle: '',
                image_url: '',
                buttons: [{
                    type: "game_play",
                    title: '',
                    payload: ''
                }]
            }]
        }
    }
};

/* GET users listing. */
router.get('/', (req, res, next) => {
    res.send('respond with a resource');
});

router.get('/push', async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    const database = client.db('tlmn');
    const collection = database.collection('status');
    const status = await collection.findOne({ _id: new ObjectID(req.query['id']) });
    client.close();
    res.json(status);
});

router.post('/push', async (req, res, next) => {
    if (req.headers["secret-key"] != SECRET_KEY) {
        res.status(400).json({ err: 1, msg: 'wrong secret key' });
        return;
    }

    const id = new ObjectID();

    const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    const database = client.db('tlmn');
    const collectionStatus = database.collection('status');
    await collectionStatus.insertOne({ _id: id, msg: 'sending', running: 1, completed: 0, total: 0, success: 0, error: 0 });

    res.redirect('/api/push?id=' + id.toHexString());
    let body = req.body;
    message.attachment.payload.elements[0].title = body.title;
    message.attachment.payload.elements[0].subtitle = body.mssage;
    message.attachment.payload.elements[0].image_url = body.image;
    message.attachment.payload.elements[0].buttons[0].title = body.button_title;
    message.attachment.payload.elements[0].buttons[0].payload = body.button_payload;

    const date = new Date();
    date.setDate(date.getDate() - 10);
    date.setHours(0, 0, 0, 0);
    const collection = database.collection('players');
    const cursor = collection.find({ updated_at: { $gte: date } });

    const total = await cursor.count();
    await collectionStatus.updateOne({ _id: id }, { $set: { total: total } });
    let batch = [];
    await cursor.batchSize(100).forEach(async (item) => {
        let recipient = JSON.stringify({ id: item.psid });
        let e = {
            method: "POST",
            relative_url: "v8.0/me/messages",
            body: "recipient=" + recipient + "&message=" + JSON.stringify(message)
        };
        batch.push(e);
        if (batch.length >= 50) {
            let copy = batch;
            batch = [];
            let res = await send(copy);
            res.forEach(async (v) => {
                const updateQuery = v.code == 200 ? { success: 1 } : { error: 1 };
                await collectionStatus.updateOne({ _id: id }, { $inc: updateQuery });
            });
            await collectionStatus.updateOne({ _id: id }, { $inc: { completed: batch.length } });
        }
    });
    if (batch.length > 0) {
        let res = await send(batch);
        res.forEach(async (v) => {
            const updateQuery = v.code == 200 ? { success: 1 } : { error: 1 };
            await collectionStatus.updateOne({ _id: id }, { $inc: updateQuery });
        });
        await collectionStatus.updateOne({ _id: id }, { $inc: { completed: batch.length } });
    }
    await collectionStatus.updateOne({ _id: id }, { $set: { running: 0 } });
    client.close();
});

async function send(batch) {
    let body = querystring.stringify({ access_token: PAGE_ACCESS_TOKEN, include_headers: false, batch: JSON.stringify(batch) });
    const response = await fetch('https://graph.facebook.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
    });
    return response.json();
}

module.exports = router;
