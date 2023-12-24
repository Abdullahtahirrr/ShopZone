async function errorHandlerMiddleware(err, req, res, next) {
  if (err.status === 404) {
    res.redirect('/pages-404');
  } else {
    console.error(err.stack);
    // res.status(500).send('Something went wrong!');
    // res.redirect('/nomore');
    res.redirect('/pages-login');
  }
}

module.exports = errorHandlerMiddleware;
