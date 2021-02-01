var router = require('express').Router();
/* GET home page. */
router.post('/', function(req, res) {
    console.log('reqPOST ==> data', req.data);
    console.log('reqPOST ==> query', req.query);
    console.log('reqPOST ==> body', req.body);
    res.setHeader('Content-Type', 'text/plain');
    if (req.body) {
        if (req.body['signed_request']) {
            let dataFbSend = req.body['signed_request'];
            console.log('dataFbSend ', dataFbSend);
            res.status(200).send(JSON.stringify('Done'));
        } else {
            res.status(200).send('Done');
        }
    } else {
        res.status(200).send('Done');
    }
});
router.get('/', function(req, res) {
    console.log('reqGET ==> data', req.data);
    console.log('reqGET ==> query', req.query);
    console.log('reqGET ==> body', req.body);
    res.status(200).send('Execute Done ');
})

module.exports = router;