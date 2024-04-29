const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri =  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yajxl17.mongodb.net/tourism?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4di5irs.mongodb.net/tourism?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)

// setup a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // make a Connection the client to the server	(optional starting in v4.7)
        await client.connect();

    
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensureing that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is running')
});
app.post('/addTouristSpot', async (req, res) => {
    try {
        const db = client.db('tourism'); 
        const touristSpotCollection = db.collection('touristspot');
        const countryCollection = db.collection('country'); 

        const { image, tourists_spot_name, country_Name, location, short_description, average_cost, seasonality, travel_time, totaVisitorsPerYear, userEmail, userName } = req.body;
        const createdAt = new Date();
        const updatedAt = new Date();
        const touristSpotResult = await touristSpotCollection.insertOne({ 
            image,
            tourists_spot_name,
            country_Name,
            location,
            short_description,
            average_cost,
            seasonality,
            travel_time,
            totaVisitorsPerYear,
            userEmail,
            userName,
            createdAt,
            updatedAt
        });

        // Insert country for tourist spots or update existing country
        const countryResult = await countryCollection.updateOne(
            { name: country_Name }, 
            { $addToSet: { touristSpots: tourists_spot_name } }, 
            { upsert: true } 
        );

        res.status(201).json({
            message: 'Tourist spot and associated country added successfully',
            insertedTouristSpotId: touristSpotResult.insertedId,
            updatedCountry: countryResult.modifiedCount > 0
        });
    } catch (error) {
        console.error('Error adding tourist spot and associated country:', error);
        res.status(500).json({ message: 'Error adding tourist spot and associated country' });
    }
});


// GET touristspots to fetch all tourist spots
app.get('/touristspots', async (req, res) => {
    try {
        const db = client.db('relax'); 
        const collection = db.collection('touristspot'); 

        // Find all tourist spots
        const allTouristSpots = await collection.find().toArray();

        res.json(allTouristSpots);
    } catch (error) {
        console.error('Error fetching all tourist spots:', error);
        res.status(500).json({ message: 'Error fetching all tourist spots' });
    }
});
// to fetch latest post
app.get('/latestPosts', async (req, res) => {
    try {
        const db = client.db('tourism'); 
        const collection = db.collection('touristspot'); // Assuming your posts collection is named 'posts'

        // Find the latest 6 posts, sorted by creation timestamp in descending order
        const latestPosts = await collection.find().sort({ createdAt: -1 }).limit(6).toArray();

        res.json(latestPosts);
    } catch (error) {
        console.error('Error fetching latest posts:', error);
        res.status(500).json({ message: 'Error fetching latest posts' });
    }
});
app.get('/touristspots/:id', async (req, res) => {
    try {
        const db = client.db('relax'); 
        const collection = db.collection('touristspot'); 

        const { id } = req.params;

        // Find the tourist spot by ID
        const touristSpot = await collection.findOne({ _id: ObjectId(id) });

        if (!touristSpot) {
            return res.status(404).json({ message: 'Tourist spot not found' });
        }

        res.json(touristSpot);
    } catch (error) {
        console.error('Error searching for tourist spot by ID:', error);
        res.status(500).json({ message: 'Error searching for tourist spot by ID' });
    }
});

// PUT endpoint to update a tourist spot by ID
app.put('/touristspots/:id', async (req, res) => {
    try {
        const db = client.db('relax'); 
        const collection = db.collection('touristspot'); 

        const { id } = req.params;
        const updatedData = req.body;

        // Update the tourist spot by ID
        const result = await collection.updateOne(
            { _id: ObjectId(id) },
            { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Tourist spot not found' });
        }

        res.json({ message: 'Tourist spot updated successfully' });
    } catch (error) {
        console.error('Error updating tourist spot:', error);
        res.status(500).json({ message: 'Error updating tourist spot' });
    }
});

// DELETE endpoint to remove a tourist spot by ID
app.delete('/touristspots/:id', async (req, res) => {
    try {
        const db = client.db('relax'); 
        const collection = db.collection('touristspot'); 

        const { id } = req.params;

        // Delete the tourist spot by ID
        const result = await collection.deleteOne({ _id: ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Tourist spot not found' });
        }

        res.json({ message: 'Tourist spot deleted successfully' });
    } catch (error) {
        console.error('Error deleting tourist spot:', error);
        res.status(500).json({ message: 'Error deleting tourist spot' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
});