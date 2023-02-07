let express = require("express");
var ObjectId = require('mongodb').ObjectID;
const MongoClient = require("mongodb").MongoClient;
let app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
let Port  = process.env.PORT || 3000;
let db;
// connect local
// const url = "mongodb://localhost:27017";
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
const url ="mongodb+srv://latxtechnologies:xP1HIfd9sETa16lG@cluster0.kqzypwq.mongodb.net/latxtechnologies";

MongoClient.connect(url, (err, connection)=>{
    if(err) throw err;
    db = connection.db('studentDtabase');
})
app.get("/",function(req,res){
    res.send("Server Started..");
})

// for all locations
app.get("/location",function(req,res){
    db.collection('Location').find().toArray((err, data)=>{
        if(err) throw err;
        res.send(data)
    })
})

// for all menu
app.get("/menu",function(req,res){
    db.collection('RestaurantMenu').find().toArray((err, data)=>{
        if(err) throw err;
        res.send(data)
    })
})

// for all mealtype
app.get("/meal",function(req,res){
    db.collection('MealType').find().toArray((err, data)=>{
        if(err) throw err;
        res.send(data)
    })
})


// for all restro
// app.get("/restro", function(req,res){
//     db.collection("RestaurantData").find().toArray((err, data)=>{
//         if(err) throw err;
//         res.send(data);
//     })
// })

// restro as per the location
// app.get("/restro/:id", function(req,res){
//     let stateId = Number(req.params.id);
//     db.collection("RestaurantData").find({state_id : stateId}).toArray((err, data)=>{
//         if(err) throw err;
//         res.send(data);
//     })
// })

app.get("/restro", function(req,res){
    let stateId = Number(req.query.state_id);
    let mealType = Number(req.query.mealtype)
    let query={};
    if(stateId && mealType)
    {
        query={state_id : stateId, "mealTypes.mealtype_id" : mealType}
    }
    else if(stateId){
        query = {state_id : stateId}
    }
    else if(mealType)
    {
        query = {"mealTypes.mealtype_id" : mealType}
    }
    db.collection("RestaurantData").find(query).toArray((err, data)=>{
        if(err) throw err;
        res.send(data);
    })
})


// restro detail page
app.get("/details/:id", function(req,res){
    let restId = Number(req.params.id);
    db.collection("RestaurantData").find({restaurant_id : restId}).toArray((err, data)=>{
        if(err) throw err;
        res.send(data);
    })
})

// menu wrt restro
app.get("/menu/:id", function(req,res){
    let restId = Number(req.params.id);
    db.collection("RestaurantMenu").find({restaurant_id : restId}).toArray((err, data)=>{
        if(err) throw err;
        res.send(data);
    })
})

//filters
app.get("/filter/:mealId", function(req,res){
    let mealId = Number(req.params.mealId);
    let cuisineId = Number(req.query.cuisine);
    let lcost = Number(req.query.lcost);
    let hcost = Number(req.query.hcost);
    let sort = {cost:1}
    let skip = 0;
    let limit = 9999999;

    let query={"mealTypes.mealtype_id" : mealId};
    
    if(req.query.skip && req.query.limit){
        skip = Number(req.query.skip);
        limit = Number(req.query.limit);
    }

    if(req.query.sort){
        sort={cost : Number(req.query.sort)}
    }
    if(cuisineId && lcost && hcost){
        console.log("yes")
        query={"mealTypes.mealtype_id" : mealId, "cuisines.cuisine_id" : cuisineId, $and:[{cost : {$gt:lcost, $lt:hcost}}]}
    }
    else if(cuisineId){
        query={"mealTypes.mealtype_id" : mealId, "cuisines.cuisine_id" : cuisineId}
    }else if(lcost & hcost){
        query={"mealTypes.mealtype_id" : mealId, $and:[{cost : {$gt:lcost, $lt:hcost}}]}
    }
    
    db.collection("RestaurantData").find(query).sort(sort).skip(skip).limit(limit).toArray((err, data)=>{
        if(err) throw err;
        res.send(data);
    })
})


//orders
app.post("/placeOrder", function(req,res){
    db.collection("orders").insert(req.body, (err, result)=>{
        if(err) throw err;
        res.send("Order Placed");
    })  
})


// check order
app.get("/orders", function(req,res){
    let query={};
    let email = req.query.email;

    if(email){
        query={email : email}
    }
    db.collection("orders").find(query).toArray((err, result)=>{
        if(err) throw err;
        res.send(result);
    }) 
})

//find menu data from array of menu Id
app.post("/menuItem", function(req,res){
    db.collection("RestaurantMenu").find({menu_id : {$in : req.body}}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})


app.post("/cart/:emailId/:menuId", function(req,res){
    db.collection('cart').insertOne(req.body, (err,result)=>{
        if(err) throw err;
        // res.send(result);
        res.send("Item added to cart successfully")
    })
})


app.get("/cart",function(req,res){
    let email = req.query.email;
    let query = {}
    if(email){
        query = {email : email}
    }
    db.collection('cart').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

app.delete("/deleteorder",(req,res)=>{
    db.collection('orders').remove({},(er, result)=>{
        if(err) throw err;
        res.send("Order Deleted");
    })
})

app.put("/updateorder/:id", (req,res)=>{
    let oId = ObjectId(req.params.id);
    let status = req.query.status ? req.query.status : "Pending";

    db.collection('orders').updateOne(
        {_id : oId},
        {
            $set : {
                "status" : status,
                "bank_name" : req.query.bank_name,
            }
        }, (err, result) =>{
            if(err) throw err;
            res.send('Status Update');
        }
    )

})

app.listen(Port, ()=>{
    console.log(Port)
});