'use strict';
const readXlsxFile = require('read-excel-file/node')
const axios = require('axios')
const vars = require('./constants')
const fs = require('fs');
const winston = require('winston')

async function main() {
  try {
    // Create logger
    const logger = winston.createLogger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'files/2-create-square-subscriptions-2022.log' })
      ]
    });
    
    let rawdata = fs.readFileSync('files/1-load-customers-to-square.log');
    let rows = JSON.parse(rawdata).message;
    const ids = [];

    // File path.
    for (let i = 0; i < rows.length; i++) {
      console.log('Processing ' + (i+1).toString() + ' of ' + (rows.length).toString() );
      const id = rows[i].id;
      const membershipType = rows[i].membershipType;

      // IF membershiptype = Lifetime or Sustain, need to create invoice
      // IF membershiptype != Lifetime or Sustain, need to create subscription
      if ([ //Lifetime or Sustain
            'N7QTTGHSFD52TGACZEMGBJEF',
            '767TDW2GBRZGWYNJ2LX7HTHA',
            'JBOUAAP7X5PMY6PVVTWZR3GK',
            'FJRKXHWXRWQ3YOJN7XGSAJ2J'
          ].includes(membershipType)) {
        //TODO for lifetime/sustain
        
      } else {
        // Square
        const body = {
          "customer_id": id,
          "location_id": vars.locationId,
          "plan_id": membershipType,
          "canceled_date": "2022-12-31"
        }
        
        // POST /v2/customers
        await axios.post(vars.url+'/v2/subscriptions', body,
        {
          headers: {
            'Square-Version': vars.squareVersion,
            Authorization: 'Bearer ' + vars.token, 
            'Content-Type': 'application/json'
          }
        })
          .then(response=> {
            //const {id, created_at} = response.data.body
            //console.log(`Response ${id}: ${created_at}`)
            //console.log("status code:", response.status);
            //console.log("status text:", response.statusText);
            //console.log("data:", response.data);
            //console.log(response.data)
            ids.push({
              "id": id,
              "membershipType": membershipType,
              "subscriptionId": response.data.subscription.id
            })
          })
          .catch(error => console.log(error))
      }
      
    }
    logger.info(ids) //will write to file
  } catch (err) {
    console.log(`Error!`);
    console.log(err)
  } 
}

main()