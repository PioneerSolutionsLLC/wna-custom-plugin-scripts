'use strict';
const readXlsxFile = require('read-excel-file/node')
const axios = require('axios')
const vars = require('./constants')
const fs = require('fs');
const winston = require('winston')
const { 
  v4: uuidv4,
} = require('uuid');

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
      const membershipDesc = rows[i].membershipDesc;
      let newOrderId;
      let newInvoiceId;
      let newInvoiceVersion;

      // IF membershiptype = Lifetime or Sustain, need to create invoice
      // IF membershiptype != Lifetime or Sustain, need to create subscription
      if ([ //Lifetime or Sustain
            'N7QTTGHSFD52TGACZEMGBJEF',
            '767TDW2GBRZGWYNJ2LX7HTHA',
            'JBOUAAP7X5PMY6PVVTWZR3GK',
            'FJRKXHWXRWQ3YOJN7XGSAJ2J'
          ].includes(membershipType)) {
        //TODO for lifetime/sustain
        // 1) create square order 2) create invoice 3) publish invoice 4) return payment link
        // CREATE ORDER
        const body = {
          "idempotency_key": uuidv4(),
          "order" : {
            "customer_id": id,
            "location_id": vars.locationId,
            "line_items": [{
              "quantity": '1',
              "catalog_object_id": membershipType
            }]
          }          
        }
        
        await axios.post(vars.url+'/v2/orders', body,
        {
          headers: {
            'Square-Version': vars.squareVersion,
            Authorization: 'Bearer ' + vars.token, 
            'Content-Type': 'application/json'
          }
        })
          .then(response=> {
            newOrderId = response.data.order.id;
          })
          .catch(error => console.log(error))
          await new Promise(resolve => setTimeout(resolve, 5000));

        // CREATE INVOICE
        const body2 = {
          "idempotency_key": uuidv4(),
          "invoice" : {
            "title": membershipDesc,
            "accepted_payment_methods": {
              "bank_account": true,
              "card": true,
              "square_gift_card": false
            },
            "location_id": vars.locationId,
            "delivery_method": "SHARE_MANUALLY",
            "primary_recipient": {
              "customer_id": id
            },
            "order_id": newOrderId,
            "payment_requests": [{
              "automatic_payment_source": "NONE",
              "due_date": new Date().toISOString().slice(0, 10),
              "request_type": "BALANCE"
            }]
          }          
        }
        
        await axios.post(vars.url+'/v2/invoices', body2,
        {
          headers: {
            'Square-Version': vars.squareVersion,
            Authorization: 'Bearer ' + vars.token, 
            'Content-Type': 'application/json'
          }
        })
          .then(response=> {
            newInvoiceId = response.data.invoice.id;
            newInvoiceVersion = response.data.invoice.version;
          })
          .catch(error => console.log(error))
          await new Promise(resolve => setTimeout(resolve, 5000));

        // PUBLISH INVOICE
        const body3 = {
          "idempotency_key": uuidv4(),
          "version" : newInvoiceVersion   
        }
        
        await axios.post(vars.url+'/v2/invoices/'+newInvoiceId+'/publish', body3,
        {
          headers: {
            'Square-Version': vars.squareVersion,
            Authorization: 'Bearer ' + vars.token, 
            'Content-Type': 'application/json'
          }
        })
          .then(response=> {
            //SUCCESS
          })
          .catch(error => console.log(error))
      } else {
        // Square
        const body = {
          "customer_id": id,
          "location_id": vars.locationId,
          "plan_id": membershipType,
          "canceled_date": "2022-12-31"
        }
        
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