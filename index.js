require('dotenv/config')
const express =  require('express')
const cors =  require('cors')
const morgan =  require('morgan')
const helmet =  require('helmet')
const bodyParser = require('body-parser');
const app = express();
const routes = require('./routes/index')

app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors())
app.use(helmet())
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use('/api/', routes)

app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {

    console.log(err)
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    console.log(err)
    res.json({
        message: err.message,
        error: err
    });

});

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`listening on port ${port}`))