// Imports and requires
const express = require('express')
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const Airtable = require('airtable');
require("dotenv").config();
const app = express()
const package = require('./package.json')


// Express options
app.use(express.static(`public`))
app.use(bodyParser.urlencoded({ extended: true }));
// app.enable('view cache');

// Handlebars options
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: `views/layouts/`
}))
app.set('view engine', 'hbs')
app.set('views', `views`)

// Airtable API Key
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY

// Airtable Base ID
const baseId = process.env.AIRTABLE_BASE_ID || 'app8wtFgcpJCtRHVC'

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(baseId);

// Webserver port
const port = process.env.PORT || 3000



// Execution time: 900ms
// Retrieve all SAC Info from SAC Information
const sacInfo = (cardID, callback, err) => {
    /**
     * Retrieve all SAC Info from SAC Information and store in array
     * @param {Function} callback - Validation Function
     * @param {Function} err - Error message when Card ID cannot be found.
     */
    var start = new Date()
    let count = 0
    sacInfoObj = {}
    base('SAC Information').select({
        // Selecting the first 100 records in Grid view:
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            // Save record into an array
            if (record.get('Card ID') == cardID) {
                sacInfoObj[record.get('Card ID')] = record.id
                callback()
                var end = new Date() - start
                console.log('Execution time: %dms', end)
                return
            }
            else {
                count++
            }
        });
        if (count >= records.length) {
            err()
        }
    })
}


// Express routings
app.get('/', (req, res) => {
    res.render('index', { layout: 'main' });
});


app.post('/', (req, res) => {
    const card_id = req.body.cardID
    sacInfo(card_id, () => {
        const checkInDateTime = new Date()
        const recordId = sacInfoObj[card_id]
        base('SAC Time Sheet').create([
            {
                "fields": {
                    "Card ID": card_id,
                    'SAC_Card_ID': [recordId],
                    "Check In Date-Time": checkInDateTime
                }
            },
        ], (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
        res.render('index', {
            'statusSuccessIn': true,
            'timeLogged': checkInDateTime.toLocaleTimeString('en-US',{ timeZone: 'Asia/Singapore' })
        })
    }, () => {
        // If Card ID cannot be found in SAC Information
        // Feedback: User Not Found
        res.render('index', {
            'statusFail': true
        })
    }
    )
})

app.get('/about', (req, res) => {
    const timestampNow = new Date()
    res.render('about', {
        'version': package.version,
        'versionNumber': package.version.split('-')[0],
        'versionTime': package.version.split('-')[2],
        'versionDate': package.version.split('-')[1],
        'osName': process.platform,
        'osTime': timestampNow.toLocaleTimeString()
    })
})

//Error Codes
app.use(function (req, res, next) {
    if (res.status(400)) {
        res.render('errorCodes', {
            'errorCode': '400',
            'errorMessage': 'Its a bad request!'
        })
    }
    else if (res.status(404)) {
        res.render('errorCodes', {
            'errorCode': '404',
            'errorMessage': 'Are you on the right page?'
        })
    }
    else if (res.status(500)) {
        res.render('errorCodes', {
            'errorCode': '500',
            'errorMessage': 'Its a internal server error!'
        })
    }
    else if (res.status(502)) {
        res.render('errorCodes', {
            'errorCode': '502',
            'errorMessage': 'Its a bad gateway!'
        })
    }
    else if (res.status(503)) {
        res.render('errorCodes', {
            'errorCode': '503',
            'errorMessage': 'Service is currently unavailable.'
        })
    }
})

// Initialise webserver
app.listen(port, () => {
    console.log(`SAC attandance app listening at http://localhost:${port}`)
})