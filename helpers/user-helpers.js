var db=require("../config/connection")
var collection=require("../config/collections")
var bcrypt = require('bcrypt')
const { response } = require("express")
var objectId=require('mongodb').ObjectID
const Razorpay=require('razorpay')
const { resolve } = require("path")
var instance = new Razorpay({
    key_id: 'rzp_test_3IkHeAOpfojCfD',
    key_secret: 'RbXd4rtF5Y2xWp2Wj5yAij16',
});
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{resolve(data.ops[0])})
        }
    )
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log("login success")
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            }
            else{
                console.log("login failed");
                resolve({status:false})
            }
        })
    },
    addTocart:(proID,userID)=>{
        let proObj={
            item:objectId(proID),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
          let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
          
          if(userCart)
          {
            let prodExist=userCart.products.findIndex(product=>product.item==proID)
            console.log(prodExist);
            if(prodExist!=-1)
            {
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userID),'products.item':objectId(proID)},
                {
                    $inc:{'products.$.quantity':1}
                }).then(()=>{
                    resolve()
                })
            }
            else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userID)},
                        {

                            $push:{products:proObj}

                        }
                    ).then((response)=>{
                        resolve()
                    })
            }
          }
          else{
              let cartobj={
                  user:objectId(userID),
                  products:[proObj]
              }
              db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response)=>{
                  resolve()
              })
          }
      })  
    },
    getCartproducts:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate
            (
                [
                    {
                        $match:{user:objectId(userID)}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:"_id",
                            as:'product'
                        }
                    },
                    
                    { 
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                        }
                    }
                ]
            ).toArray()
        console.log(cartItems.product);
        resolve(cartItems)
        })
    },
    getCartcount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
        
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)
                
            })
            if(cart)
            {
                count=cart.products.length
                
            }
            resolve(count)
            }
        )
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        //details.price=parseInt(details.price)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1)
            {
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else
            {
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }).then((response)=>{
                    resolve({status:true})
                })
            }
        }
           
    )},

    getTotalAmount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate
            (
                [
                    {
                        $match:{user:objectId(userID)}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity',
                            //product.price: { $toInt: "$product.price" },
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:"_id",
                            as:'product'
                        }
                    },
                    
                    { 
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                        }
                    },
                    {
                        $group:{
                            _id:null,
                            
                            total:{$sum:{$multiply:['$quantity',{$toInt:'$product.price'}]}}
                            //total:{$sum:{$multiply:{$toInt:['$quantity','$product.price']}}}
                        }
                    }
                ]
            ).toArray()
        console.log(total);
        resolve(total[0].total)
        })
    },
    
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode,
                },
                userID:objectId(order.userID),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                date:new Date(),
                status:status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userID)})
                resolve(response.ops[0]._id)
            })
        })
    },
    getCartproductsList:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
            resolve(cart.products)
        })
    },
    getUserOrders:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userID:objectId(userID)}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts:(orderID)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderID)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:"_id",
                        as:'product'
                    }
                },
                
                { 
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                    }
                }
            ]
        ).toArray()
        console.log(orderItems);
        resolve(orderItems)
        })
    },
    generateRazorpay:(orderID,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total,  // amount in the smallest currency unit   *100 is to get the coorect amount
                
                currency: "INR",
                receipt: ""+orderID
              };
              instance.orders.create(options, function(err, order) {
                console.log(order);
                resolve(order)
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'RbXd4rtF5Y2xWp2Wj5yAij16');
            console.log(hmac);
            hmac.update(details['payment[razorpay_order_id]']+'|'+details[ 'payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex');
            console.log(hmac);
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderID)},
            {
                $set:{
                    status:'placed',
                }
            }
            ).then(()=>{
                resolve()
            })

        })
    }

}