const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { createSchema } = require('../validators/categoryValidator');

router.get('/', ctrl.getAll);
router.post('/', validate(createSchema), ctrl.create);
router.put('/:id', validate(createSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
