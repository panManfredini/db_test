import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as logger from 'koa-logger';
import * as serve from 'koa-static';
import {setup as arango_setup, query, query_graph} from './arango_setup'
import {pg_query, pg_setup, pg_joints} from './postgres_setup'
import {neo_query, neo_setup} from './neo_setup'
import { json } from 'body-parser';


const app = new Koa();
const router = new Router();

//------ Configs -----//
var static_store = __dirname + "/../public/";

console.log('Local dir is:  ' + __dirname);

arango_setup()
    .then(()=>{console.log('Arango setup complete!')})
    .catch((err)=>{console.log("Arango setup Error: ", err)});

pg_setup()
    .then(()=>{ console.log('PG setup complete'); })
    .catch((err)=>{ console.log("setup PG error, ",err);});


neo_setup()
    .then(()=>{console.log('Neo4J setup complete!')})
    .catch((err)=>{console.log('Neo4J Error:', err);});

    
app.use( logger() );
app.use( serve( static_store ) );

router.get('/arango', async (ctx) => {
    
    let p = await query();

    ctx.body = 'Query:\n' + p ;
   
});

router.get('/pg', async (ctx) => {

    let out = await pg_joints();
    ctx.body = 'Query:\n' + JSON.stringify(out);
   
});


router.get('/graph', async (ctx) => {

    let res = await query_graph();
    ctx.body = 'Query:\n ' + res;
   
});

router.get('/neo', async (ctx) => {

    let res = await neo_query();
    ctx.body = 'Query:\n ' + JSON.stringify(res);
   
});


app.use(router.routes());

app.listen(3000);

console.log('Server running on ---> \t http://localhost:3000');
