const express = require("express");
const axios = require("axios");
const app = express();
const port = 5000;

const getThirdPartyData = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch third-party data" });
  }
};

app.get("/api/third-party-data", getThirdPartyData);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
