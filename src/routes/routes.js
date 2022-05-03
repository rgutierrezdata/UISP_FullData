const express = require('express');
const router = express.Router();

const uisp = require('./uisp');

router.get('/fetchData', uisp.fetchData);
router.put('/migrateData', uisp.migrateData);
router.delete('/cleanData', uisp.cleanData);
router.put('/addCharges', uisp.addCharges);
router.put('/updateZIDs', uisp.updateClients);
router.put('/updateBillingDateMarch', uisp.updateBillingDateMarch);
router.put('/updateMarchClients', uisp.updateMarchClients);
router.get('/processDates', uisp.processDates);
router.post('/registerPaymentLogs', uisp.registerPaymentLogs);
router.post('/editPendingClients', uisp.editPendingClients);
router.post('/fixIVA', uisp.fixIVA);
router.post('/pauseServices', uisp.pauseServices);
router.post('/addClientsName', uisp.addClientsName);
router.post('/addCustomers', uisp.addCustomers);

module.exports = router;
