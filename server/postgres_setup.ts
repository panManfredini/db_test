const { Pool, Client } = require('pg')
const { PerformanceObserver, performance } = require('perf_hooks');

export const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'test_db',
    password: '1234',
    port:  5432,
  });

export async function pg_setup(){
    const client = await pool.connect();

    try {
        await client.query('BEGIN')

        await client.query('DROP TABLE ref_offer_order;');
        await client.query('DROP TABLE orders;');
        await client.query('DROP TABLE offers;');
        await client.query('DROP TABLE users;');
        await client.query('DROP TABLE providers;');
        
        await client.query('CREATE TABLE users(id SERIAL PRIMARY KEY, name varchar(255), email varchar(255));');
        await client.query('CREATE TABLE providers(id SERIAL PRIMARY KEY, name varchar(255), contact varchar(255));');
        await client.query(`CREATE TABLE orders(id SERIAL PRIMARY KEY, usr_id int REFERENCES users(id), 
             title varchar(255), description varchar(255), where_lat int, where_log int, whens int, 
             broadcast bool, accepted bool );`);
        await client.query(`CREATE TABLE offers(id SERIAL PRIMARY KEY, provider_id int REFERENCES providers(id), 
            title varchar(255), description varchar(255), whens int, items varchar(255),
            items_prices varchar(255));`); 
        
        await client.query(`CREATE TABLE ref_offer_order(
            id_offer int REFERENCES offers(id), id_order int REFERENCES orders(id), 
            PRIMARY KEY(id_offer, id_order));`); 
        
        await client.query('COMMIT');
    }
    catch(err){ 
        await client.query('ROLLBACK');
        throw err;
    }
    finally{
        client.release();
    }

    for(let i=0; i<100000; i++){
        await insert();
    }
}



async function insert(){
    const client = await pool.connect();

    try {
        let usr_tmp = await client.query(`
            INSERT INTO users(name,email) VALUES ('bill','bill@bill.com') RETURNING *;`);
        let prov_tmp = await client.query(`
        INSERT INTO providers(name,contact) VALUES ('john','12345678923') RETURNING *;`);
        
        let order_tmp = await client.query(`
            INSERT INTO orders(usr_id, title, description, where_lat, where_log, whens, broadcast, accepted)
            VALUES( ${usr_tmp.rows[0].id}, 'lavori a caso', 'some description', 10,  20, 31, false, false )
            RETURNING *;
        `);
        let offer_tmp = await client.query(`
            INSERT INTO offers(provider_id, title, description, whens, items, items_prices)
            VALUES( ${prov_tmp.rows[0].id}, 'whatever', 'some description', 31, '[a,b,c,f]', '1,2,3,4')
            RETURNING *;
        `);
        await client.query(`
            INSERT INTO ref_offer_order(id_offer, id_order)
            VALUES( ${offer_tmp.rows[0].id}, ${order_tmp.rows[0].id});
        `);
    }
    catch(err){
        throw err;
    }
    finally{
        client.release();
    }   
}

export async function pg_query(){
    let start = performance.now();
    const client = await pool.connect();

    let res = await client.query('SELECT * FROM test_table;')
    
    let tot = performance.now() -start;
    console.log('Performance ms ', tot);
    client.release();
}
export async function pg_joints(){

    let usr_id = 10;

    let start = performance.now();
    const client = await pool.connect();
    let res = await client.query(`
        SELECT * FROM orders
        INNER JOIN ref_offer_order ON orders.id = ref_offer_order.id_order
        INNER JOIN offers ON ref_offer_order.id_offer = offers.id
        INNER JOIN providers ON offers.provider_id = providers.id 
        WHERE orders.usr_id = ${usr_id};
    `);
    
    let tot = performance.now() -start;
    console.log('Performance ms ', tot);
    client.release();
    return res.rows[0];
}


