const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//middleware
function hasName(req, res, next){
    const {data: {name}={}}=req.body;
    if(name){
        res.locals.name=name;
        return next();
    }else{
        next({status:400, message: "Dish must include a name"});
    }
}
function hasDescription(req, res, next){
    const {data: {description}={}}=req.body;
    if(description){
        res.locals.description=description;
        return next();
    }else{
        next({status:400, message: "Dish must include a description"});
    }
}
function hasPrice(req, res, next){
    const {data: {price}={}}=req.body;
    if(typeof(price)==="number" && price>0){
        res.locals.price=price;
        return next();
    }
    else if(price<0){
        next({status:400, message: "Dish must have a price that is an integer greater than 0"});
    }
    else{
        next({status:400, message: "Dish must include a price"});
    }
}
function hasImage(req, res, next){
    const {data: {image_url}={}}=req.body;
    if(image_url){
        res.locals.image_url=image_url;
        return next();
    }else{
        next({status:400, message: "Dish must include a image_url"});
    }
}
function idMatch(req, res, next){
    const {dishId}= req.params;
    const {data:{id}={}}=req.body;
    if(!id || dishId===id){
        return next();
    }else{
        next({status: 400, message:`URL dish ID: ${dishId} does not match given id: ${id}`});
    }
}

function ifExists(req, res, next){
    const {dishId}=req.params;
    const foundDish=dishes.find((dish)=>dish.id===dishId);
    if(foundDish){
        res.locals.dish=foundDish;
        return next();
    }else{
        next({status: 404, message:`No matching dish for ${dishId}`});
    }
}

//HTTP method handlers
function list(req, res){
    res.status(200).json({data: dishes});
}

//has...
function create (req, res){
    const {name, description, price, image_url}= res.locals;
    const newDish={
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url 
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

//ifExists
function read(req, res){
    res.status(200).json({data: res.locals.dish});
}

//ifExists, has...
function update(req, res){
    const {name, description, price, image_url} = res.locals;
    let dish= res.locals.dish;
    dish={
        ...dish,
        name: name,
        description: description,
        price: price,
        image_url: image_url
    };
    res.status(200).json({data: dish});
}

module.exports={
    list,
    create: [hasName, hasDescription, hasPrice, hasImage, create],
    read: [ifExists, read],
    update: [ifExists, idMatch, hasName, hasDescription, hasPrice, hasImage, update]
}