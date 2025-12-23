const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const validate = require('../middleware/validate');
const { createSchema } = require('../validators/productValidator');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validate(createSchema), ctrl.create);
router.put('/:id', validate(createSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
