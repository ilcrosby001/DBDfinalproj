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
  console.log('role: "' + req.app.locals.formdata.role + '"');
  if (!req.app.locals.formdata.role) {
    res.render('index', {title: pagetitle});
  }
  else if (req.app.locals.formdata.role === 'Faculty') {
    renderFaculty(req, res, next, pagetitle);
  }
  else {
    res.render(req.app.locals.formdata.role, {role: req.app.locals.formdata.role});
  }
  
}


function renderFaculty(req, res, next, pagetitle) {
  let query = 'select CourseNo, OffTerm, OffYear';
  query += ' from Offering';
  query += ` where FacSSN = '${req.app.locals.formdata.ident}';`;
  console.log('Query: ' + query);
  req.app.locals.query = query;
  console.log('r.a.l.q:' + req.app.locals.query);
  req.app.locals.db.all(query, [], 
      (err, rows) => {
          if (err) {
              throw err;
          }
          req.app.locals.courses = rows;  
          /* Has to happen inside handler, to wait for rows */
          res.render(req.app.locals.formdata.role, 
            {role: req.app.locals.formdata.role,
             courses: req.app.locals.courses,
             query: req.app.locals.query});
      });
}



module.exports = router;
