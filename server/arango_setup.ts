import { Database, aql } from "arangojs";
const { PerformanceObserver, performance } = require('perf_hooks');

export const adb = new Database();

console.log('Setup DB');
adb.useBasicAuth("root", "1234");

const users = adb.collection('users');
const providers = adb.collection('providers');

const orders = adb.collection('orders');
const offers = adb.collection('offers');

const edge_orders = adb.edgeCollection('edge_orders');
const edge_offers = adb.edgeCollection('edge_offers');


// Setup
export async function setup(){
    try{ await users.drop(); } catch { }
    try{ await providers.drop(); } catch{}
    try{ await orders.drop();} catch{ }
    try{ await edge_orders.drop(); } catch{ }
    try{ await edge_offers.drop(); } catch{ }
    try{ await offers.drop(); } catch{ }

    try{ await users.create(); } catch { }
    try{ await providers.create(); } catch { }
    try{ await orders.create(); } catch{ }
    try{ await offers.create(); } catch{ }
    try{ await edge_orders.create(); } catch{ }
    try{ await edge_offers.create(); } catch{ }

    console.log('User collection created, ');
    
    let usr_template  = 
    {
        name: 'bill',
        email:'bill@bill.com',
    }
    let providers_template = {
        name:'john',
        cantact:'0699206731',

    }
    let order_template = {
        title:"lavori a caso",
        where_latitude:32,
        where_longitude:90,
        when:Date.now(),
        description:"some description",
        broadcasted:false,
        accepted:false
    }
    let offer_template = {
        title:"lavori a caso",
        when:Date.now(),
        description:"some description",
        items:["a","b","c"],
        items_price:[1,2,3]
    }
    for (let i=0; i < 100000; i++){
        let usr_tmp =   await users.save(usr_template);
        let order_tmp = await orders.save(order_template);
        let offer_tmp = await offers.save(offer_template);
        let provider_tmp = await providers.save(providers_template);
        
        await edge_orders.save({_from:usr_tmp._id, _to:order_tmp._id});
        await edge_offers.save({_from:provider_tmp._id,_to:offer_tmp._id});
        await edge_offers.save({_from:offer_tmp._id,_to:order_tmp._id});

    }
    for (let i=0; i < 10000; i++){
        let usr_tmp = await users.any();
        let provider_tmp = await providers.any();

        let order_tmp = await orders.save(order_template);
        let offer_tmp = await offers.save(offer_template);

        await edge_orders.save({_from:usr_tmp._id, _to:order_tmp._id});
        await edge_offers.save({_from:provider_tmp._id,_to:offer_tmp._id});
        await edge_offers.save({_from:offer_tmp._id,_to:order_tmp._id});
        
    }
}

export async function query_graph(){

    const doc = await users.any();

    let start = performance.now();

    try{
        /*let cursor = await adb.query(aql`
            FOR v, e, p IN 1..3 ANY ${doc} ${edge_offers},${edge_orders}
                FILTER v.name =='john'
                RETURN {order: p.vertices[1], offer:p.vertices[2], provider:p.vertices[3]}
        `); */
        let cursor = await adb.query(aql`
        for v in 1..1 any ${doc} ${edge_orders}
            let off = (
                for c,k,p in 2..2 any v ${edge_offers}
                return { offer:p.vertices[1], prov:p.vertices[2] }
            )
        return { order:v, offers:off}`);

        const result = await cursor.all();
        let tot = performance.now() - start;
        console.log('total time in ms ', tot);
        console.log('  for a total of ' + result.length + ' orders '); 
        console.log(typeof result);
        return JSON.stringify(result);

    }
    catch(err){ 
        console.log(err);
        return 'failed';
    }
}



export async function query() {
    let start = performance.now();

    try {
      const cursor = await adb.query(aql`
        for p in pollo 
        RETURN p
      `);
      const result = await cursor.all();

    let tot = performance.now() - start;
    console.log('result: ',result);
    console.log('total time in ms ', tot);
      return JSON.stringify(result);

    } catch (err) {
        console.log('Error: ', err);
        return 'failed';
    }

  };