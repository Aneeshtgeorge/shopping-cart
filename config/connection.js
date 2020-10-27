const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    const link="mongodb+srv://crossroads:crossroads@cluster0.vvj3k.mongodb.net/crossroads?retryWrites=true&w=majority"
    const dbname="shopping"
    mongoClient.connect(link,{ useNewUrlParser: true, useUnifiedTopology: true },(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
    
}

module.exports.get=function(){
    return state.db
}