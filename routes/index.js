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

function capitalizeString(s) {
    let result = s.toLocaleUpperCase();
    if (s.length > 1) {
        result = s.substr(0, 1).toLocaleUpperCase() + s.substr(1).toLocaleLowerCase();
    }
    return result;
}


function renderIndex(req, res, next, pagetitle) {
  console.log('role: "' + req.app.locals.formdata.role + '"');
  if (!req.app.locals.formdata.role) {
    res.render('index', {title: pagetitle});
  }
  else if (req.app.locals.formdata.role === 'faculty') {
    renderFaculty(req, res, next, pagetitle);
  }
  else if (req.app.locals.formdata.role === 'student') {
    renderStudent(req, res, next, pagetitle);
  }
  else if (req.app.locals.formdata.role === 'registrar') {
    renderRegistrar(req, res, next, pagetitle);
  }
  else {
    res.render(req.app.locals.formdata.role, {role: req.app.locals.formdata.role});
  }
  
}


function renderFaculty(req, res, next, pagetitle) {
  let query = 'select OfferNo, CourseNo, OffTerm, OffYear';
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
          
          console.log('Grading course: "' + req.app.locals.formdata.gradingCourse + '"')
          if (req.app.locals.formdata.gradingCourse) {
              let query2 = 'select Student.StdSSN, StdFirstName, StdLastName, EnrGrade';
              query2 += ' from Offering natural join Enrollment natural join Student';
              query2 += ` where OfferNo = '${req.app.locals.formdata.gradingCourse}';`
              console.log('Query2 ' + query2);
              req.app.locals.query2 = query2;
              req.app.locals.db.all(query2, [],
                  (err, students) => {
                      if (err) {
                          throw err;
                      }
                      req.app.locals.students = students;
                      actuallyRenderFaculty(req, res, next, 
                          capitalizeString(req.app.locals.formdata.role), req.app.locals.courses,
                          req.app.locals.formdata.gradingCourse, students
                      );
                    }
              ) 
          }
          else {
              /* Has to happen inside handler, to wait for rows */
              actuallyRenderFaculty(req, res, next, 
                  capitalizeString(req.app.locals.formdata.role), req.app.locals.courses);
              // res.render(req.app.locals.formdata.role, 
              //   {role: req.app.locals.formdata.role,
              //    courses: req.app.locals.courses,
              //    query: req.app.locals.query});
          }
      });
}

function actuallyRenderFaculty(req, res, next, role, courses, gradingCourse=undefined, students=undefined) {
    res.render('faculty', {role: role,
                          courses: courses,
                          gradingCourse: gradingCourse,
                          students: students});
}

function renderStudent(req, res, next, pagetitle){
  let query = 'select CourseNo, OffTerm, OffYear, FacFirstName, FacLastName, EnrGrade';
  query += ' from (Enrollment natural join Offering) left join Faculty on Faculty.FacSSN = Offering.FacSSN';
  query += ` where StdSSN = '${req.app.locals.formdata.ident}';`;
  console.log('Query: ' + query);
  req.app.locals.query = query;
  console.log('r.a.l.q:' + req.app.locals.query);
  req.app.locals.db.all(query, [], 
      (err, rows) => {
          if (err) {
              throw err;
          }
          req.app.locals.courses = rows;

          let query2 = 'select CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays';
          query2 += ' from (Offering left outer join Faculty on Faculty.FacSSN = Offering.FacSSN) inner join Enrollment on Enrollment.OfferNo = Offering.OfferNo'
          query2 += ` where OffTerm = 'WINTER' and OffYear = 2025`
          query2 += ` and Enrollment.OfferNo not in (select OfferNo from Enrollment where StdSSN = '${req.app.locals.formdata.ident}')`
          query2 += ' group by Enrollment.OfferNo;'
          req.app.locals.query2 = query2;
          req.app.locals.db.all(query2, [], 
            (err, rows) => {
                if (err) {
                    throw err;
                }
                req.app.locals.nextterm = rows;

                res.render(req.app.locals.formdata.role, 
                  {role: capitalizeString(req.app.locals.formdata.role),
                  courses: req.app.locals.courses,
                  nextterm: req.app.locals.nextterm,
                  query: req.app.locals.query,
                  query2: req.app.locals.query2});
          })     
  });  
}

function renderRegistrar(req, res, next, pagetitle){
  let query = 'select OfferNo, CourseNo, Faculty.FacSSN, FacLastName, OffLocation, OffTime, OffDays';
  query += ' from Offering left join Faculty on Faculty.FacSSN = Offering.FacSSN';
  query += ` where OffTerm = 'WINTER' and OffYear = 2025`;
  console.log('Query: ' + query);
  req.app.locals.query = query;
  console.log('r.a.l.q:' + req.app.locals.query);
  req.app.locals.db.all(query, [], 
      (err, rows) => {
          if (err) {
              throw err;
          }
          req.app.locals.courses = rows;

          console.log('Canceling Offering: "' + req.app.locals.formdata.cancelOffer + '"')
          if (req.app.locals.formdata.cancelOffer) {
              let query2 = 'select OfferNo, CourseNo, Faculty.FacSSN, FacLastName, OffLocation, OffTime, OffDays';
              query2 += ' from Offering left join Faculty on Faculty.FacSSN = Offering.FacSSN';
              query2 += ` where OfferNo = '${req.app.locals.formdata.cancelOffer}';`
              console.log('Query2 ' + query2);
              req.app.locals.query2 = query2;
              req.app.locals.db.all(query2, [],
                  (err, students) => {
                      if (err) {
                          throw err;
                      }
                      req.app.locals.offers = offers;
                      actuallyRenderRegistrar(req, res, next, 
                          capitalizeString(req.app.locals.formdata.role), req.app.locals.courses,
                          req.app.locals.formdata.cancelOffer, offers);
                    }
              ) 
          }
          else {
              /* Has to happen inside handler, to wait for rows */
              actuallyRenderRegistrar(req, res, next, 
                  capitalizeString(req.app.locals.formdata.role), req.app.locals.courses);
          }
          // res.render(req.app.locals.formdata.role, 
          //   {role: capitalizeString(req.app.locals.formdata.role),
          //   courses: req.app.locals.courses,
          //   query: req.app.locals.query});
  });  
}

function actuallyRenderRegistrar(req, res, next, role, courses, cancelOffer=undefined, offers=undefined) {
  res.render('registrar', {role: role,
                        courses: courses,
                        cancelOffer: cancelOffer,
                        offers: offers});
}

module.exports = router;
