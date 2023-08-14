const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const day = date.getDate();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-shane:Test12345@cluster0.2bv9yza.mongodb.net/todoDB");

const itemsSchema = {
  name: String
};

const Items = mongoose.model("Item",itemsSchema);

const item1 = new Items({
  name: "Buy Food"
});

const item2 = new Items({
  name: "Cook Food"
}); 

const item3 = new Items({
  name: "Eat Food"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  Items.find({}).then((items) => {
    if (items.length===0){
      Items.insertMany(defaultItems).then(() => {
        console.log("items were inserted");
      })
      .catch(error => {
        console.error("Error inserting:", error);
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: day, newListItems: items});
    }
  })
  .catch(error => {
    console.error("Error:", error);
  });


});

app.post("/", function(req, res){

  const nitem = req.body.newItem;
  const listTitle=req.body.list;

  const anewItem = new Items({
    name:nitem
  });

  if(listTitle === day){
    anewItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listTitle}).then(foundList => {
      foundList.items.push(anewItem);
      foundList.save();
      res.redirect("/"+listTitle);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId=req.body["check"];
  const listTitleName=req.body["listTitleName"];

  if(listTitleName === day){
    Items.findByIdAndRemove(checkedItemId).then(() => {
      console.log("item was removed");
    })
    .catch(error => {
      console.error("Error removing:", error);
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listTitleName},{$pull: {items:{_id:checkedItemId}}}).then(foundList => {
      res.redirect("/"+listTitleName);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }

  
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
  .then(foundList => {
    if (foundList) {
      res.render("list", {listTitle:foundList.name,newListItems:foundList.items});
    
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect(`/${customListName}`)
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
