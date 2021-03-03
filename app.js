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

// check if card id present
function idPresent(cardID) {
    return new Promise((resolve, reject) => {
        console.log('idPresent Started to run')
        var start = new Date()
        let count = 0


        // Retrieve from Airtable SAC Information
        base('SAC Information').select({
            view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.
            records.forEach(function (record) {
                // Save record into an array
                if (record.get('Card ID') == cardID) {
                    resolve({
                        cardID: record.get('Card ID'),
                        recordID: record.id
                    })
                    console.log('Found the card id')
                    var end = new Date() - start
                    console.log('Execution time: %dms', end)
                    return
                }
                else {
                    count++
                }
            });
            if (count >= records.length) {
                console.log('Couldnt find the id')
                reject(new Error('Card ID Cannot Be Found In SAC Information'))
            }
            fetchNextPage()
        })
    })

}


// Express routings
app.get('/', (req, res) => {
    res.render('index', { layout: 'main' });
});


app.post('/', (req, res) => {
    const card_id = req.body.cardID
    async function a(){
        const b = await idPresent(card_id)
        const checkInDateTime = new Date()
        base('SAC Time Sheet').create([
            {
                "fields": {
                    "Card ID": b.cardID,
                    'SAC_Card_ID': [b.recordID],
                    "Check In Date-Time": checkInDateTime,
                    'Status': 'On Shift'
                }
            }
            ])
        console.log('Clock In Successful')
        res.render('index', {
            'statusSuccessIn': true,
            'timeLogged': checkInDateTime.toLocaleTimeString()
        })
    }
    a()
})
    
    //     sacInfo(card_id, () => {
    //         const checkInDateTime = new Date()
    //         const recordId = sacInfoObj[card_id]
    //         base('SAC Time Sheet').create([
    //             {
    //                 "fields": {
    //                     "Card ID": card_id,
    //                     'SAC_Card_ID': [recordId],
    //                     "Check In Date-Time": checkInDateTime,
    //                     'Status': 'On Shift'
    //                 }
    //             },
    //         ], (err) => {
    //             if (err) {
    //                 console.error(err);
    //                 return;
    //             }
    //         });
    //         res.render('index', {
    //             'statusSuccessIn': true,
    //             'timeLogged': checkInDateTime.toLocaleTimeString()
    //         })
    //     }, () => {
    //         // If Card ID cannot be found in SAC Information
    //         // Feedback: User Not Found
    //         res.render('index', {
    //             'statusFail': true
    //         })
    //     }
    //     )
    // }
    // clockIn()
// })

app.get('/about', (req, res) => {
    res.render('about', {
        'version': package.version 
    })
})


// Initialise webserver
app.listen(port, () => {
    console.log(`SAC attandance app listening at http://localhost:${port}`)
})