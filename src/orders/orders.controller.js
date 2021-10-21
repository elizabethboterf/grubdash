const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const validStatus= ["pending", "preparing", "out-for-delivery", "delivered"];

//middlware
function hasDeliverTo(req, res, next){
    const {data: {deliverTo}={}}=req.body;
    if(deliverTo){
        res.locals.deliverTo=deliverTo;
        return next();
    }else{
        next({status: 400, message:"Order must include a deliverTo"});
    }
}

function hasMobileNumber(req, res, next){
    const {data: {mobileNumber}={}}=req.body;
    if(mobileNumber){
        res.locals.mobileNumber=mobileNumber;
        return next();
    }else{
        next({status: 400, message:"Order must include a mobileNumber"});
    }
}

function hasDishes(req, res, next){
    const {data: {dishes}={}}=req.body;
    if( Array.isArray(dishes) && dishes.length>0){
        res.locals.dishes=dishes;
        return next();
    }else if(dishes){
        next({status: 400, message:"Order must include at least one dish"})
    }else{
        next({status: 400, message:"Order must include a dish"});
    }
}

function hasQuantity(req, res, next){
    const dishes=res.locals.dishes;
    dishes.forEach((dish, index)=>{
        if(!Number.isInteger(dish.quantity) || !(dish.quantity>0)){
            next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
        }
    });
    return next();
}

function hasStatus (req, res, next){
   const {data: {status}={}}= req.body;
   if(status==="delivered"){
    next({status:400, message:'A delivered order cannot be changed'}); 
   }else if(validStatus.includes(status)){
    res.locals.status=status;
    return next();
   }else{
    next({status:400, message:"Order must have a status of pending, preparing, out-for-delivery, delivered"});
   }
}

function isPending(req, res, next){
    const order= res.locals.order;
    if(order.status==="pending"){
        return next();
    }else{
        next({status:400, message:"An order cannot be deleted unless it is pending"});
    }
}

function idMatch(req, res, next){
    const {orderId}= req.params;
    const {data:{id}={}}=req.body;
    if(!id || orderId===id){
        return next();
    }else{
        next({status: 400, message:`URL order ID: ${orderId} does not match given id: ${id}`});
    }
}

function ifExists(req, res, next){
    const {orderId}=req.params;
    const foundOrder=orders.find((order)=>order.id===orderId);
    if(foundOrder){
        res.locals.order=foundOrder;
        return next();
    }else{
        next({status: 404, message:`No matching order for ${orderId}`});
    }
}

//HTTP method handlers
function list(req, res){
    res.status(200).json({data: orders});
}

//has...
function create(req, res){
    const {deliverTo, mobileNumber, dishes }=res.locals;
    const newOrder={
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        dishes: dishes
    };
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

//ifExists
function read(req, res){
    res.status(200).json({data: res.locals.order});
}

//ifExists, idMatch, has...
function update(req, res){
    const {deliverTo, mobileNumber, dishes, status}= res.locals;
    let order= res.locals.order;
    order={
        ...order,
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        dishes: dishes,
        status: status
    };
    res.status(200).json({data: order});
}
//ifExists
function destroy (req, res){
    const foundOrder= res.locals.order;
    const index= orders.findIndex((order)=> order.id === foundOrder.id);
   const deleted =orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports={
    list,
    create: [hasDeliverTo, hasMobileNumber, hasDishes, hasQuantity, create],
    read: [ifExists, read],
    update: [ifExists, idMatch, hasDeliverTo, hasMobileNumber, hasDishes, hasQuantity, hasStatus,update],
    delete: [ifExists, isPending, destroy]
};