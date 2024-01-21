const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const  cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
     origin:["http://localhost:5173"],
     credentials:true}));
app.use(express.json());
app.use(cookieParser())
 

console.log(process.env.DB_PASS)

// const uri = `mongodb+srv://siiffuuu:$Eo4oNDvVPeSJ2zTc@cluster0.swu9d.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.swu9d.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i7jrqrv.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const Logger =(req,res,next)=>{
    console.log("this is logger info METHOD=>",req.method,"URL =>",req.url );
    next()
}
const verifyToken=(req,res,next)=>{
    const token = req.cookies?.token;
    console.log(token)
    next()
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('car-doctor').collection('services');
        const bookingCollection = client.db('car-doctor').collection('bookings');

        // Jwt Api 
        app.post('/jwt',(req,res)=>{
            const loggedUser = req.body;
            const token = jwt.sign(loggedUser,process.env.SECRET_TOKEN,{expiresIn:"1h"})
            console.log("hitting jwt token ",loggedUser)
            
            res
            .cookie("token",token,{httpOnly:true,secure:true,sameSite:"none"})
            .send({success:true})

        })
        app.post('/logOut',(req,res)=>{
            const user= req.body;
            console.log("hitting logout",user)
            res.clearCookie("token",{maxAge:0}).send({success:true})
        })

        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };

            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })


        // bookings 
        app.get('/bookings',Logger,verifyToken, async (req, res) => {
            // console.log(req.query.email,"hitted");
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            // console.log(result)
            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('doctor is running')
})

app.listen(port, () => {
    console.log(`Car Doctor Server is running on port ${port}`)
})