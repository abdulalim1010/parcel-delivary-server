const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json()); // JSON body parser

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster2.emeucb3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db('parcelDB');
    const parcelCollection = db.collection('parcels');
    const userCollection = db.collection('users')
    const ridersCollection = db.collection('riders'
    );

    // ✅ Root route
    app.get('/', (req, res) => {
      res.send('📦 Parcel Delivery Server is Running');
    });

    // ✅ Get parcels with optional email filter
    app.get('/parcels', async (req, res) => {
      try {
        const userEmail = req.query.email;
        const query = userEmail ? { creator_email: userEmail } : {};
        const options = {
          sort: { creation_date: -1 },
        };
        const parcels = await parcelCollection.find(query, options).toArray();
        res.send(parcels);
      } catch (error) {
        console.error('❌ Error fetching parcels:', error);
        res.status(500).send({ message: 'Failed to get parcels' });
      }
    });
    app.post('/users', async (req, res) => {
      const email = req.body.email;
      const userExists = await userCollection.findOne({ email: email });
    
      if (userExists) {
        return res.status(200).send({ message: 'User already exists', inserted: false });
      }
    
      const user = req.body;
      const result = await userCollection.insertOne(user);
      return res.send({ inserted: true, id: result.insertedId });
    });
    

    app.post('/riders',async(req, res) =>{

      const rider = req.body;
      const result = await ridersCollection.insertOne(rider);
      res.send(result)
    })

// ✅ Check if user exists by email
app.get('/users/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const user = await userCollection.findOne({ email: email });

    if (user) {
      res.send(user); // send user object if exists
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error checking user:', err);
    res.status(500).send({ message: 'Server error' });
  }
});



    
    // ✅ POST route to create a parcel
    app.post('/parcels', async (req, res) => {
      try {
        const parcelData = req.body;
        const result = await parcelCollection.insertOne(parcelData);
        res.status(201).json({
          message: 'Parcel created',
          id: result.insertedId
        });
      } catch (error) {
        console.error('❌ Error creating parcel:', error);
        res.status(500).json({
          error: 'Failed to create parcel',
          details: error.message
        });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
