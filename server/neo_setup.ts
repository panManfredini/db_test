
var neo4j = require('neo4j-driver').v1;

var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "1234"));
const { PerformanceObserver, performance } = require('perf_hooks');


export async function neo_setup(){

    var session = driver.session();
    let die = await session.run('MATCH (n) DETACH DELETE n');
    session.close();

    for(let k=0; k<100; k++){
        await setup_data();
    }
}

async function setup_data(){

    let template  = 
    {
        usr_data:{
            name: 'bill',
            email:'bill@bill.com'
        },
        
        provider_data: {
            name:'john',
            cantact:'0699206731'
        },
        order_data:{
            title:"lavori a caso",
            where_latitude: 32,
            where_longitude: 90,
            when: Date.now(),
            description: "some description",
            broadcasted: false,
            accepted: false
        },
        offer_data:{
            title:"lavori a caso",
            when:Date.now(),
            description:"some description",
            items:["a","b","c"],
            items_price:[1,2,3]
        }

    }
    var session = driver.session();
    try{
        let result = await session.run(`
            CREATE (usr:Users {usr_data})
            CREATE (provider:Providers {provider_data})
            CREATE (offer:Offers {offer_data})
            CREATE (order:Orders {order_data})
            CREATE
                (usr)-[:ORDERED]->(order),
                (provider)-[:OFFERED]->(offer),
                (offer)-[:OFFERED]->(order)
            `,template);
    }
    catch(err){ throw err; }

    session.close();
}

export async function neo_query(){
    let start = performance.now();
    var session = driver.session();

    try{
        let result = await session.run('match (usr:Users)-[:ORDERED]-(order)<-[:OFFERED]-(offer)-[:OFFERED]-(provider) RETURN * limit 11');
        let tot = performance.now() - start;
        console.log('Tot time:', tot);
        session.close();
        return result.records;
    }
    catch (err) { 
        console.log(err);
        return 'failed';
    }
}
