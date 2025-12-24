const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const validate = require('../middleware/validate');
const { createSchema } = require('../validators/productValidator');
const { updateSchema } = require('../validators/updateProductValidator');
const { stockSchema } = require('../validators/stockValidator');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createSchema), ctrl.create);
router.put('/:id', validate(updateSchema), ctrl.update);
router.patch('/:id/stock', validate(stockSchema), ctrl.updateStock);
router.delete('/:id', ctrl.remove);

module.exports = router;
