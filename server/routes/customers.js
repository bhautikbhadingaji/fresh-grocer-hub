const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerController');

router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.get('/:name', ctrl.getById);
router.post('/payment', ctrl.recordPayment);

module.exports = router;
