var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    req.app.locals.formdata = {};
    renderIndex(req, res, next)
});

/* POST home page. */
router.post('/', function(req, res, next) {
    req.app.locals.formdata = req.body;
    renderIndex(req, res, next);
});

function capitalizeString(s) {
    let result = s.toLocaleUpperCase();
    if (s.length > 1) {
        result = s.substr(0, 1).toLocaleUpperCase() + s.substr(1).toLocaleLowerCase();
    }
    return result;
}

function renderIndex(req, res, next) {
    let pagetitle = 'Final Project';
    console.log('role: "' + req.app.locals.formdata.role + '"');
    if (!req.app.locals.formdata.role) {
        res.render('index', {title: pagetitle});
    }
    else if (req.app.locals.formdata.role.toLocaleLowerCase() === 'faculty') {
        renderFaculty(req, res, next, pagetitle + ': Faculty');
    }
    else if (req.app.locals.formdata.role.toLocaleLowerCase() === 'student') {
        renderStudent(req, res, next, pagetitle + ': Student');
    }
    else if (req.app.locals.formdata.role.toLocaleLowerCase() === 'registrar') {
        renderRegistrar(req, res, next, pagetitle + ': Registrar');
    }
    else {
        res.render(req.app.locals.formdata.role.toLocaleLowerCase(), 
                  {role: req.app.locals.formdata.role,
                    title: pagetitle
                  });
    }
}


function renderFaculty(req, res, next, pagetitle) {
    // Query faculty courses first
    let query = 'select OfferNo, CourseNo, OffTerm, OffYear';
    query += ' from Offering';
    query += ` where FacSSN = '${req.app.locals.formdata.ident}'`;
    query += ' order by OffYear, OffTerm, CourseNo, OfferNo;';
    console.log('Query: ' + query);
    req.app.locals.query = query;
    console.log('r.a.l.q:' + req.app.locals.query);
    req.app.locals.db.all(query, [], (err, rows) => {
          if (err) {
            throw err;
        }
        req.app.locals.courses = rows;

        // Grading a course?
        console.log('Grading course: "' + req.app.locals.formdata.gradingCourse + '"')
        if (req.app.locals.formdata.gradingCourse) {
            updateGradeAndRender(req, res, next, pagetitle);
        }
        else {
            /* Has to happen inside handler, to wait for rows */
            actuallyRenderFaculty(req, res, next, pagetitle + ' list courses');
        }
    });
}

function updateGradeAndRender(req, res, next, pagetitle) {
    // If updating a grade, do that first, so the student query reflects the new data
    if (req.app.locals.formdata.newGrade) {
        let grade_update_query = 'update Enrollment set EnrGrade = ';
        grade_update_query += `'${req.app.locals.formdata.newGrade}' `;
        grade_update_query += `where StdSSN = '${req.app.locals.formdata.StdSSN}' `;
        grade_update_query += `and OfferNo = '${req.app.locals.formdata.gradingCourse}';`;
        console.log('grade_update_query: ' + grade_update_query);
        req.app.locals.grade_update_query = grade_update_query;

        req.app.locals.db.run(grade_update_query, [], (err) => {
            if (err) {
                throw err;
            }
            queryStudentsAndRender(req, res, next, pagetitle + ' update grade');
        });
    }
    else {  // No update, just query students
        queryStudentsAndRender(req, res, next, pagetitle + ' show grades');
    }
}

function queryStudentsAndRender(req, res, next, pagetitle) {
    let query2 = 'select Student.StdSSN, StdFirstName, StdLastName, EnrGrade';
    query2 += ' from Offering natural join Enrollment natural join Student';
    query2 += ` where OfferNo = '${req.app.locals.formdata.gradingCourse}'`;
    query2 += ' order by StdLastName, StdFirstName, StdSSN;';
    console.log('Query2 ' + query2);
    req.app.locals.query2 = query2;
    req.app.locals.db.all(query2, [],
        (err, students) => {
            if (err) {
                throw err;
            }
            req.app.locals.students = students;
            actuallyRenderFaculty(req, res, next, pagetitle);
        }
  ) 
}

function actuallyRenderFaculty(req, res, next, pagetitle) {
    console.log('Form data: ' + JSON.stringify(req.app.locals.formdata));
    res.render('faculty', {title: pagetitle,
                          role: req.app.locals.formdata.role,
                          courses: req.app.locals.courses,
                          gradingCourse: req.app.locals.formdata.gradingCourse,
                          students: req.app.locals.students});
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

                console.log('Form data: ' + JSON.stringify(req.app.locals.formdata));
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
  console.log('Form data: ' + JSON.stringify(req.app.locals.formdata));
  res.render('registrar', {role: role,
                        courses: courses,
                        cancelOffer: cancelOffer,
                        offers: offers});
}

module.exports = router;
