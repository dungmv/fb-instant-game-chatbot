const { MongoClient, ObjectID } = require('mongodb');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/:id', async (req, res) => {
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    const database = client.db(process.env.DB_INSTANT_GAME);
    const collection = database.collection('Configs');
    const config = await collection.findOne({_id: ObjectID(req.params.id)});
    console.log('mode ==> ',mode,'token ==> ',token);
    if (mode === 'subscribe' && token === config.VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        console.warn('Failed validation. Make sure the tokens match.');
        res.sendStatus(403);
    }
});

router.post('/:id', (req, res) => {
    let data = req.body;
    // Make sure this is a page subscription
    console.log('data ',data);
    if (data.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function (entry) {
            // Here you can obtain values about the webhook, such as:
            // var pageID = entry.id
            // var timeOfEvent = entry.time
            entry.messaging.forEach(function (event) {
                if (event.game_play) {
                    receivedGameplay(event, 'players-game-' + req.params.id);
                }
            });
        });
    }
    res.sendStatus(200);
})

//
// Handle game_play (when player closes game) events here.
//
async function receivedGameplay(event, collectionName) {
    // Page-scoped ID of the bot user
    var senderId = event.sender.id;

    // FBInstant player ID:  event.game_play.player_id
    // FBInstant context ID: event.game_play.context_id
    // User's Page-scoped ID: event.sender.id

    const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    const database = client.db(process.env.DB_INSTANT_GAME);
    const collection = database.collection(collectionName);
    await collection.updateOne(
        { _id: event.game_play.player_id },
        { $set: { psid: senderId, updated_at: new Date() } },
        { upsert: true }
    );
    client.close();
}

module.exports = router;
