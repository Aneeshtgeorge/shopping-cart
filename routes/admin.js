var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
 
  productHelpers.getAllProducts().then((product)=>{
    console.log(product)
    res.render('admin/view-products',{admin:true,product});
  })

  
});

router.get('/add-product',function(req,res)
  {res.render("admin/add-products")
})

router.post('/add-product',(req,res)=>{
  
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    console.log(id)
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/add-products')
      }
      else{console.log(err)}
    })
    
  })
})

router.get('/delete-products/',(req,res)=>{
  let proID=req.query.id
  console.log(proID);
  productHelpers.deleteProducts(proID).then((response)=>{
    res.redirect("/admin")
  })
})

router.get('/edit-products/',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.query.id)
  console.log(product);
  res.render('admin/edit-products',{product})
})

router.post('/edit-products/:id',(req,res)=>{
  productHelpers.updateProducts(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+req.params.id+'.jpg')
    }
  })
})


module.exports = router;




///"C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe"