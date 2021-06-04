const mysql = require('mysql');
const inquirer = require('inquirer');

// create the connection information for the sql database
const connection = mysql.createConnection({
    host: 'localhost',

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: 'root',

    // Your password
    password: 'waeer123',
    database: 'greatBay_DB',
});


const start = () => {
    inquirer
        .prompt({
            name: 'postOrBid',
            type: 'input',
            message: 'Would you like to [POST] an auction or [BID] on an auction?',
            choices: ['POST', 'BID', 'EXIT'],
        })
        .then((answer) => {
            if (answer.postOrBid === 'POST') {
                PostBid();
            } else if (answer.postOrBid === 'BID') {
                bidAuction();
            } else {
                connection.end();
            }

        })
}
const PostBid = () => {

    inquirer
        .prompt([{
                name: 'item',
                type: 'input',
                message: 'What is the item you would like to submit?',
            },
            {
                name: 'category',
                type: 'input',
                message: 'What category would you like to place your auction in?',
            },
            {
                name: 'startingBid',
                type: 'input',
                message: 'What would you like your starting bid to be?',
                validate(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                },
            },
        ])
        .then((answer) => {
            connection.query('INSERT INTO auctions SET?', {
                item_name: answer.item,
                category: answer.category,
                starting_bid: answer.startingBid || 0,
                highest_bid: answer.startingBid || 0,
            }, (err) => { if (err) throw err; })
            start();
        });
};

const bidAuction = () => {
    connection.query('SELECT * FROM auctions', (err, results) => {

        inquirer.prompt([{
            name: 'choice',
            type: 'rawlist',
            choices() {
                let bidChoices = [];
                results.forEach(({ item_name }) => {
                    bidChoices.push(item_name);
                });
                return bidChoices;
            },
            message: 'What auction would you like to place a bid in?',
        }, {
            name: 'bid',
            type: 'input',
            message: 'How much would you like to bid?',
        }]).then((answer) => {
            let chosenItem;
            results.forEach((item) => {
                if (item.item_name === answer.choice) {
                    chosenItem = item;
                }
            });

            if (parseInt(answer.bid) <= chosenItem.highest_bid) {
                console.log('Your bid was too low. Try again...')
                start();
            } else if (answer.bid > chosenItem.highest_bid) {
                connection.query('UPDATE auctions SET ? WHERE ?', [{
                    highest_bid: answer.bid
                }, {
                    id: chosenItem.id,
                }], (error) => {
                    if (error) throw err;
                    console.log('Bid placed successfully!');
                    start();
                })

            }




        })

    })


}


connection.connect((err) => {
    if (err) throw err;
    start();
});