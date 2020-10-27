var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');

const verifyLogin=(req,res,next)=>{
  if(req.session.userloggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

var usersHelpers=require('../helpers/user-helpers')
/* GET home page. */
router.get('/', async function(req, res, next) {

  let user=req.session.user
  console.log(user);
  let cartcount=null
  if(req.session.user)
  {
    cartcount= await usersHelpers.getCartcount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((product)=>{
    
    res.render('./user/view-products',{product,user,cartcount});
  })
});

router.get('/login',(req,res)=>{
  if(req.session.user)
  {
    res.redirect('/')
  }
  else{
  res.render('./user/login',{"loginerror":req.session.userloginerror})
  req.session.userloginerror=false
  }
})

router.get('/signup',(req,res)=>{
  res.render('./user/signup')
})

router.post('/signup',(req,res)=>{
  usersHelpers.doSignup(req.body).then((response)=>{
    console.log(response)
   
    req.session.user=response
    req.session.user.loggedIn=true
    res.redirect('/')
  })
})

router.post('/login',(req,res)=>{
  usersHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.user=response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }
    else{
      req.session.userloginerror=true
      res.redirect('/login')
    }
  }
  
  )
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userloggedIn=false
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await usersHelpers.getCartproducts(req.session.user._id)
  let totalvalue=await usersHelpers.getTotalAmount(req.session.user._id)
  console.log(products);
  res.render('user/cart',{products,user:req.session.user._id,totalvalue})
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call");
  usersHelpers.addTocart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })  
})

router.post('/change-product-quantity',(req,res,next)=>{
  usersHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await usersHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/place-order',verifyLogin, async(req,res)=>{
  let total=await usersHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products=await usersHelpers.getCartproductsList(req.body.userID)
  let totalPrice=await usersHelpers.getTotalAmount(req.body.userID)
  usersHelpers.placeOrder(req.body,products,totalPrice).then((orderID)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else{
      usersHelpers.generateRazorpay(orderID,totalPrice).then((response)=>{
        res.json(response)
      })
    }
    
  })
  console.log(req.body);
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/orders',async(req,res)=>{
  let orders=await usersHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})

router.get('/view-order-products/:id',async(req,res)=>{
  let products=await usersHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  usersHelpers.verifyPayment(req.body).then(()=>{
    usersHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
})

module.exports = router;
