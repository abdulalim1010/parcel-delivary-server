const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allow React frontend to access this server
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json()); // JSON body parser

// ✅ MongoDB connection URI
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

    // ✅ Root route
    app.get('/', (req, res) => {
      res.send('📦 Parcel Delivery Server is Running');
    });

    // ✅ Get all parcels OR filtered by user email
    app.get('/parcels', async (req, res) => {
      try {
        const userEmail = req.query.email;
        const query = userEmail ? { created_by: userEmail } : {};
        const options = {
          sort: { createdAt: -1 },
        };
        const parcels = await parcelCollection.find(query, options).toArray();
        res.send(parcels);
      } catch (error) {
        console.error('❌ Error fetching parcels:', error);
        res.status(500).send({ message: 'Failed to get parcels' });
      }
    });

    // ✅ Create a parcel
    app.post('/parcels', async (req, res) => {
      try {
        const parcelData = req.body;
        const result = await parcelCollection.insertOne(parcelData);
        res.status(201).json({
          message: 'Parcel created',
          id: result.insertedId
        });
      } catch (error) {
        console.error('❌ Insert error:', error);
        res.status(500).json({
          error: 'Failed to create parcel',
          details: error.message
        });
      }
    });

    // ✅ Confirm MongoDB connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
