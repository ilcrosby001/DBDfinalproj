var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.formdata = {};
  renderIndex(req, res, next, 'Final Project')
  // res.render('index', { title: 'Final Project' });
});

/* POST home page. */
router.post('/', function(req, res, next) {
  req.app.locals.formdata = req.body;
  renderIndex(req, res, next, ' ');
});


function renderIndex(req, res, next, pagetitle) {
  if (!req.app.locals.formdata.role) {
    res.render('index', {title: pagetitle});
  }
  else {
    res.render(req.app.locals.formdata.role, {role: req.app.locals.formdata.role});
  }
  
}


module.exports = router;
