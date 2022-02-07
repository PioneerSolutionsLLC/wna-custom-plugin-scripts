const readXlsxFile = require('read-excel-file/node')
const axios = require('axios')
const vars = require('./constants')
const winston = require('winston')
let mysql = require('mysql');

try {
  // Create logger
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'files/1-load-customers-to-square.log' })
    ]
  });

  const con = mysql.createConnection({
    host: '192.185.119.143',
    user: 'plugin_wna',
    password: 'football.58',
    database: 'plugin_wna'
  });

  //Loop customer import file
  readXlsxFile('./files/customer-list-small-test.xlsx').then(async (rows) => {
    const ids = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let squareid;

      // Skip header row
      if (row[0] != 'First1') {
        console.log('Processing ' + i.toString() + ' of ' + (rows.length - 1).toString() );
        const first1 = (row[0] == null ? '' : row[0]);
        const last1 = (row[1] == null ? '' : row[1]);
        const first2 = (row[2] == null ? '' : row[2]);
        const last2 = (row[3] == null ? '' : row[3]);
        const address = (row[4] == null ? '' : row[4]);
        const city = (row[5] == null ? '' : row[5]);
        const state = (row[6] == null ? '' : row[6]);
        const zip = (row[7] == null ? '' : row[7]);
        const membershipType = vars.membershipTypes[row[8]];
        const phone = (row[22] == null ? '' : row[22]);
        const phone2 = (row[23] == null ? '' : row[23]);
        const email1 = (row[24] == null ? '' : row[24]);
        const email2 = (row[25] == null ? '' : row[25]);
        const vol_trees = (row[11] == null ? '' : row[11]);
        const vol_newsletter = (row[12] == null ? '' : row[12]);
        const vol_gardens = (row[13] == null ? '' : row[13]);
        const vol_luminaries = (row[14] == null ? '' : row[14]);
        const vol_social = (row[15] == null ? '' : row[15]);
        const vol_welcome = (row[16] == null ? '' : row[16]);
        const vol_photos = (row[17] == null ? '' : row[17]);
        const vol_media = (row[18] == null ? '' : row[18]);
        const vol_special = (row[19] == null ? '' : row[19]);

        // Square
        const body = {
          "given_name": first1,
          "family_name": last1,
          "email_address": email1,
          "address": {
            "address_line_1": address,
            "locality": city,
            "administrative_district_level_1": state,
            "postal_code": zip.toString(),
            "country": "US"
          },
          "phone_number": phone,
          "note": "Added by WNA Loading Script",
        }
        //console.log(body);

        // POST /v2/customers
        await axios.post(vars.url+'/v2/customers', body,
        {
          headers: {
            'Square-Version': vars.squareVersion,
            Authorization: 'Bearer ' + vars.token, 
            'Content-Type': 'application/json'
          }
        })
          .then(response=> {
            squareid = response.data.customer.id
            ids.push({
              "id": response.data.customer.id,
              "membershipType": membershipType
            })
          })
          .catch(error => console.log(error))

        //*******************WRITE TO WNA TABLE*********************** */
        const customer = {
          square_customer_id: squareid,
          wna_first_name1: first1,
          wna_last_name1: last1,
          wna_membership_type: membershipType
        }
        con.query('INSERT INTO wp_jtsptwcqyx_wna_customers SET ?', customer, (err, res) => {
          if(err) throw err;
        
          console.log('Last insert ID:', res.insertId);
        });
  
        //*************************************************** */
      }      
    };
    logger.info(ids) //will write to file

    con.end((err) => {
      // The connection is terminated gracefully
      // Ensures all remaining queries are executed
      // Then sends a quit packet to the MySQL server.
    });
  })
} catch (err) {
  console.log(`Error!`);
  console.log(err)
} 