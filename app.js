require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { request, response } = require("express");
const _ = require("lodash");

//Create connection to the database.
mongoose.set("strictQuery", false);
mongoose.connect(process.env.DB_HOST);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Add a task by clicking the +",
});
const item2 = new Item({
  name: "<-- Remove an item by checking this box",
});
const defaultItems = [item1, item2];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);



const app = express();
// get our app to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// The page load in go to the home route --> app.get("/").
app.get("/", function (req, res) {
  //Read from the database.
  Item.find({}, (err, results) => {
    if (results.length === 0) {
      Item.insertMany(defaultItems, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Item added succesfully!");
        }
      });
      res.redirect('/')
    } else {
      console.log(results);
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.get('/:customListName', (request, response) => {
  const customListName = _.capitalize( request.params.customListName);

  List.findOne({ name: customListName }, (err, result) => {
    if (!err) {
      if (!result) {
      //  Create new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
        list.save();
        response.redirect('/'+customListName)
      } else {
      // Show existing List
      response.render("list", { listTitle: result.name, newListItems: result.items })
        
      }
    }
    
  })
  
  
  


});

app.post("/", (request, response) => {
  let itemName = request.body.newItem;
  const listName = request.body.list;
  const item = new Item({
    name: itemName
  });
  //Add item to  custom List
  if (listName === "Today") {
    item.save();
    response.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      response.redirect("/" + listName);
    });
  }
    
});

//Delete item from the list
app.post('/delete', (request, response) => {
  const checkedItem = request.body.checkbox;
  const listName = request.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        response.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
      if (!err){
        response.redirect("/" + listName);
      }
    });
  }



 
});







app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
