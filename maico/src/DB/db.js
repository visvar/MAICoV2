/*import {MongoClient, ServerApiVersion } from "mongodb"

const username = encodeURIComponent("admin");
const password = encodeURIComponent("VGGmhAEDZj4D");
const cluster = "aicomposition.ssxufuu.mongodb.net";
let uri =
`mongodb+srv://admin:VGGmhAEDZj4D@aicomposition.ssxufuu.mongodb.net/test?retryWrites=true&w=majority`;

const client = new MongoClient(uri,{
serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
}
});

export function runDB(){
  run().catch(console.dir);
}

async function run() {
    try {
      await client.connect();
      const database = client.db("AIComposition");
      await database.command({ ping: 1 })
      const ratings = database.collection("MaicoV2");
      const cursor = ratings.find();
      await cursor.forEach(doc => console.dir(doc));
    } finally {
      await client.close();
    }
  }
  */