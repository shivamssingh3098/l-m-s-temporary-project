// const { default: connectDb } = require("./db");
import { app } from "./app.js";
import dotenv from "dotenv";

import connectDb from "./db/index.js";
dotenv.config({
  path: "./.env",
});

// dotenv.config();

let port = process.env.PORT || 8000;
connectDb()
  .then(() => {
    app.on("error", (err) => {
      console.log("error", err);
      throw err;
    });
    app.listen(port, () => {
      console.log(`server is listening on ${port}`);
    });
  })
  .catch((err) => {
    console.log("DB connection failed", err);
  });

//this is first approch
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from "express";
// const app = express();

// (async () => {
//   try {
//     const dbConnection = await mongoose.connect(
//       `${process.env.MONGODB_URI}/${DB_NAME}`
//     );
//     app.on("error", (error) => {
//       console.log(error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`listening on ${process.env.PORT}`);
//     });
//     console.log("dbConnection", dbConnection);
//   } catch (error) {
//     console.log(error);
//   }
// })();
