const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
require("./db/dbconnect");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const router = require("./routes/adminrouter");
app.listen(port, () => {
  console.log("Server is Ready on Port", port);
});

app.use("/", router);
