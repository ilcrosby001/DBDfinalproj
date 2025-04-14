var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Final Project' });
});

/* POST home page. */
router.post('/', function(req, res, next) {
  req.app.locals.formdata = req.body;
  renderIndex(req, res, next, ' ');
});

module.exports = router;
