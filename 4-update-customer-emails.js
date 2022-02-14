const readXlsxFile = require('read-excel-file/node')
const axios = require('axios')
const vars = require('./constants')
let mysql = require('mysql');

try {

  const con = mysql.createConnection({
    host: '192.185.119.143',
    user: 'plugin_wna',
    password: 'football.58',
    database: 'plugin_wna'
  });

  //Loop customer import file
  readXlsxFile('./files/customer-load-20220212.xlsx').then(async (rows) => {
    const ids = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let squareid;

      // Skip header row
      if (row[0] != 'First1') {
        console.log('Processing ' + i.toString() + ' of ' + (rows.length - 1).toString() );
        const first1 = (row[0] == null ? '' : row[0]);
        const last1 = (row[1] == null ? '' : row[1]);
        const address = (row[4] == null ? '' : row[4]);
        const actual_email = (row[29] == null ? '' : row[29]);

        //*******************WRITE TO WNA TABLE*********************** */
        //con.query(sql, (err, res) => {
        //  if(err) throw err;
        
        //  console.log('Square ID:', res[0]?.square_customer_id);          
        //});

        await queryPromise1(con, actual_email, first1, last1, address);
        const results = await queryPromise2(con, first1, last1, address);
        const squareId = results[0]?.square_customer_id;
        //*************************************************** */

        // Square
        const body = {
          "email_address": actual_email
        }

        // PUT /v2/customers/{id}
        await axios.put(vars.url+'/v2/customers/' + squareId, body,
        {
          headers: {
            'Square-Version': vars.squareVersion,
            Authorization: 'Bearer ' + vars.token, 
            'Content-Type': 'application/json'
          }
        })
          .then(response=> {
            console.log('Completed ' + squareId);
          })
          .catch(error => console.log(error))        
      }
    };
    
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

queryPromise1 = (con, actual_email, first1, last1, address) =>{
  return new Promise((resolve, reject)=>{
      con.query(`
        UPDATE wp_jtsptwcqyx_wna_customers SET wna_email1='${actual_email}'
        WHERE wna_first_name1 = '${first1}' 
        AND wna_last_name1 = '${last1.replace("'","")}'
        AND wna_address_line1 = '${address}'`,  (error, results)=>{
          if(error){
              return reject(error);
          }
          return resolve(results);
      });
  });
};

queryPromise2 = (con, first1, last1, address) =>{
  return new Promise((resolve, reject)=>{
    const sql = `
      SELECT square_customer_id FROM wp_jtsptwcqyx_wna_customers
      WHERE wna_first_name1 = '${first1}'
      AND wna_last_name1 = '${last1}'
      AND wna_address_line1 = '${address}'`;
    con.query(sql,  (error, results)=>{
          if(error){
              return reject(error);
          }
          return resolve(results);
      });
  });
};