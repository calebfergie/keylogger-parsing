var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// // from https://stackoverflow.com/questions/22646996/how-do-i-run-a-node-js-script-from-within-another-node-js-script
// var childProcess = require('child_process');
// 
// function runScript(scriptPath, callback) {
//
//     // keep track of whether callback has been invoked to prevent multiple invocations
//     var invoked = false;
//
//     var process = childProcess.fork(scriptPath);
//
//     // listen for errors as they may prevent the exit event from firing
//     process.on('error', function (err) {
//         if (invoked) return;
//         invoked = true;
//         callback(err);
//     });
//
//     // execute the callback once the process has finished running
//     process.on('exit', function (code) {
//         if (invoked) return;
//         invoked = true;
//         var err = code === 0 ? null : new Error('exit code ' + code);
//         callback(err);
//     });
//
// }
//
// // Now we can run a script and invoke a callback when complete, e.g.
// runScript('./public/data/log-parser.js', function (err) {
//     if (err) throw err;
//     console.log('finished running log parser');
// });

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
