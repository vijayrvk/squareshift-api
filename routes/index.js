require('dotenv/config')
const express =  require('express')
const axios = require('axios');
const router = express.Router()
const shipping_charges = require('../utils/shipping_charges')

let cart = [];
deliver_distance = 0;
router.post('/cart/add', (req, res) => {
    let error = []
    body_cart = req.body;
    body_cart.forEach(element => {
        if(element['productId']>= 100 && element['productId'] <=119){
            cart.push(element)
        }else{
            error.push(element['productId'])
        }
    });
    if(error.length>0){
        res.send({
            "status": 400,
            "message": "Failure.",
            "product_success": cart,
            "product_not_found": error
        })
    } else {
        res.send({
            "status": 200,
            "message": "success"
        })
    }
});


router.get('/cart/list', (req, res) => {
    res.send({
        "status": 200,
        "message": "success",
        "data": cart
    })
});

router.get('/cart/total/:postalCode', async(req, res) => {
    pincode = Number(req.params.postalCode)
    let totalWeight = 0;
    let totalPrice = 0;
    let shipping_charge = 0;
    let distance_charges = {};
    if(pincode >= 465535 && pincode <= 465545){
        axios.get(process.env.BASE_URL + 'warehouse/distance?postal_code='+pincode)
        .then(res => {
            
            if(res.data?.status == 200){
                deliver_distance = res.data.distance_in_kilometers;
            }

        })
        .catch(err => {
            console.log('Error: ', err.message);
        });
    }else{
        res.send({
            "status": 400,
            "message": "Invalid postal code"
        })
    }
    for await (const element of cart) {
        await axios.get(process.env.BASE_URL + 'product/'+element['productId'])
            .then(res => {
                
                if(res.data?.status == 200){
                    totalPrice += ((res.data.response.price * ( (100-res.data.response.discount_percentage) / 100 )) * element['quantity']);
                    totalWeight += ((res.data.response.weight_in_grams / 1000) * element['quantity']);
                }
            })
            .catch(err => {
                console.log('Error: ', err.message);
            });
    };
    shipping_charges.shipping_charges.forEach(weight => {
        if(weight['weight'].split("-").length > 1){
            wgt = weight['weight'].split("-")
            if(totalWeight > Number(wgt[0]) && totalWeight < Number(wgt[1])){
                distance_charges = weight['rate']
            }
        }else if(weight['weight'].substring(0, 1) == '<'){
            if(totalWeight < Number(weight['weight'].substring(1, 2)))
                distance_charges = weight['rate']
        }else if(weight['weight'].substring(0, 1) == '>'){
            if(totalWeight > Number(weight['weight'].substring(1, 5)))
                distance_charges = weight['rate']
        }
    })
    for (let [key, value] of Object.entries(distance_charges)) {
        if(key.split("-").length > 0){
            distance = key.split("-")
            if(deliver_distance > Number(distance[0]) && deliver_distance < Number(distance[1])){
                shipping_charge = value
            }
        }else if(key.substring(0, 1) == '<'){
            if(deliver_distance < Number(key.substring(1, 2)))
                shipping_charge = value
        }else if(key.substring(0, 1) == '>'){
            if(deliver_distance > Number(key.substring(1, 5)))
            shipping_charge = value
        }
    }
    
    res.send({
        "status": 200,
        "message": "success",
        "data": {
            "totalPrice" : totalPrice + shipping_charge,
            "shippingPrice": shipping_charge,
            "totalWeigt": totalWeight,
            "actualPrice": totalPrice,
            "deliverDistance": deliver_distance
        }
    })
});

router.delete('/cart/delete', (req, res) => {
    cart = [];
    res.send({
        "status": 200,
        "message": "success",
        "data": cart
    })
});

module.exports = router