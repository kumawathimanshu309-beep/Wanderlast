const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

main()
  .then(async () => {
    console.log("Connection is successful DB");
    await initDB();
    await mongoose.connection.close();
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

const initDB = async () => {
  const user = await User.findOne();

  if (!user) {
    throw new Error("No user found. Please signup first.");
  }

  await Listing.deleteMany({});

  const listings = initdata.data.map((obj) => ({
    ...obj,
    owner: user._id,
  }));

  await Listing.insertMany(listings);

  console.log("Data was initialized");
  console.log("Owner:", user.username);
};