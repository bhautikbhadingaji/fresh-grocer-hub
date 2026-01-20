const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/saleController');
const validate = require('../middleware/validate');
const { createSaleSchema, updateSaleSchema } = require('../validators/saleValidator');

router.get('/', ctrl.getAll);
router.post('/', validate(createSaleSchema), ctrl.create);
router.put('/:id', validate(updateSaleSchema), ctrl.update);
router.put('/:id/payment', ctrl.updatePayment);
router.delete('/:id', ctrl.remove);
router.get('/summary/daily', ctrl.summary);

module.exports = router;
