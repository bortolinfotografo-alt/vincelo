const { Router } = require('express');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { createBoost, getMyBoosts, cancelBoost } = require('../controllers/boost.controller');

const router = Router();

router.use(ensureAuthenticated);

router.post('/', createBoost);
router.get('/me', getMyBoosts);
router.delete('/:id', cancelBoost);

module.exports = router;
