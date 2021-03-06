const db = require("../db.js");
const shortid = require("shortid");
const tools = require('../tools/page.tool.js');

module.exports.index = async (req, res) => {
  var authUser = db
    .get("users")
    .find({ _id: req.signedCookies.userId })
    .value();
  
  var session = db
    .get("sessions")
    .find({ _id: req.signedCookies.sessionId })
    .value();
  
  var books = db.get('books').value();
  var sessionCart = !session ?  {} : session.cart;
  
  cart = Object.entries(sessionCart);
  
  function getTitle (array, bookId, attribute) {
    var [result] = array.filter(item => item._id == bookId);
    return result[attribute];
  }
  var pageNumber = parseInt(req.query.page) || 1;
  pageFoot = tools.page(cart,pageNumber);
  cartFullList = tools.array(cart,pageNumber);
  
  cartFullList = await Object.fromEntries(cartFullList.map(([key, value])=>[getTitle(books,key,'title'),value]));

  res.render('cart/index',
  {
    cart: cartFullList,
    user: authUser,
    pageFoot: pageFoot
  });
};

module.exports.add = (req, res) => {
  var bookId = req.params._id;
  var sessionId = req.signedCookies.sessionId;
  var authUser = req.signedCookies.userId;
  
  var count = db
    .get("sessions")
    .find({ _id: sessionId })
    .get("cart." + bookId, 0)
    .value();

  db.get("sessions")
    .find({ _id: sessionId })
    .set("cart." + bookId, count + 1)
    .write();

  res.redirect("/books");
};

module.exports.borrow = (req, res) => {
  var sessionId = req.signedCookies.sessionId;
  var session = db
    .get("sessions")
    .find({ _id: sessionId })
    .value();

  var cart = Object.keys(session.cart);

  cart.forEach(item => {
    db.get('transactions')
      .push({
        _id: shortid(),
        userId: session.userId,
        bookId: item,
        isComplete: false
      })
      .write();
  });

  db.get('sessions')
    .remove({_id: req.signedCookies.sessionId})
    .write();
    
  res.redirect('/transactions');
};