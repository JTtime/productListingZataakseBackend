const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config(); // To load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI || "mongodb+srv://jeevrajvjti:AYv4AeAsrGAfIwxv@cluster0.e15ft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!uri) {
  throw new Error("MONGODB_URI is not defined in .env");
}

const client = new MongoClient(uri);

// Middleware
app.use(express.json());  // For parsing application/json
app.use(cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  origin: '*', // Allows all origins (for development purposes)
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Helper function to apply pagination
const applyPagination = (query, limit, skip) => {
  return query.limit(limit).skip(skip);
};

// GET route - Fetch products with optional pagination
app.get('/api/products', async (req, res) => {
  const limit = parseInt(req.query.limit || '10', 10);
  const skip = parseInt(req.query.skip || '0', 10);

  try {
    await client.connect();
    const database = client.db("productAll");
    const collection = database.collection("productListDummy");

    const query = collection.find({});
    const products = await applyPagination(query, limit, skip).toArray();

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

// POST route - Fetch products based on filters (categories, availability, price range)
app.post('/api/products', async (req, res) => {
  const { selectedCategories, availability, priceRange, limit = 10, skip = 0 } = req.body;

  if (selectedCategories?.length && !Array.isArray(selectedCategories)) {
    return res.status(400).json({ error: "selectedCategories must be an array of strings" });
  }

  let query = {};

  if (selectedCategories?.length > 0) {
    query.category = { $in: selectedCategories };
  }

  if (availability && availability.length) {
    query.availabilityStatus = { $in: availability };
  }

  if (priceRange && priceRange.length === 2) {
    const [minPrice, maxPrice] = priceRange;
    query.price = { $gte: minPrice, $lte: maxPrice };
  }

  try {
    await client.connect();
    const database = client.db("productAll");
    const collection = database.collection("productdummy");

    const products = await applyPagination(collection.find(query), limit, skip).toArray();

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
