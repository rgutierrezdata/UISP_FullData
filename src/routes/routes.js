const express = require('express');
const router = express.Router();

const uisp = require('./uisp');

router.get('/fetchData', uisp.fetchData);
router.put('/migrateData', uisp.migrateData);
router.delete('/cleanData', uisp.cleanData);
router.put('/addCharges', uisp.addCharges);
router.put('/updateZIDs', uisp.updateClients);

module.exports = router;
