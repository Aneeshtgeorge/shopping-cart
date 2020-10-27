var db=require("../config/connection")
var collection=require("../config/collections")
var objectId=require('mongodb').ObjectID
module.exports={
    addProduct:(product,callback)=>{
        
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.ops[0]._id)
        })

    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let product=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })

    },
    deleteProducts:(proID)=>{
        return new Promise((resolve,reject)=>{
            console.log(proID);
            console.log(objectId(proID));
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proID)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(proID)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proID)}).then((product)=>{
                resolve(product)
           }) 
        })
    },
    updateProducts:(proID,prodetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proID)},{
                $set:{
                    name:prodetails.name,
                    description:prodetails.description,
                    price:prodetails.price,
                    category:prodetails.category,
                }
            }).then((response)=>{resolve()})
        })
    }

}