const axios = require("axios");
const Transaction = require("../models/Transaction");

const initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    await Transaction.deleteMany({});
    await Transaction.insertMany(response.data);
    res.status(200).send("Database initialized");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getTransactions = async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;
  const regex = new RegExp(search, "i");
  const transactions = await Transaction.find({
    dateOfSale: { $regex: `-${month}-` },
    $or: [{ title: regex }, { description: regex }, { price: regex }],
  })
    .skip((page - 1) * perPage)
    .limit(parseInt(perPage));
  res.status(200).json({ transactions });
};

const getStatistics = async (req, res) => {
  const { month } = req.query;
  const soldItems = await Transaction.countDocuments({
    dateOfSale: { $regex: `-${month}-` },
    sold: true,
  });
  const notSoldItems = await Transaction.countDocuments({
    dateOfSale: { $regex: `-${month}-` },
    sold: false,
  });
  const totalSales = await Transaction.aggregate([
    { $match: { dateOfSale: { $regex: `-${month}-` }, sold: true } },
    { $group: { _id: null, total: { $sum: "$price" } } },
  ]);
  res.status(200).json({
    totalSales: totalSales[0] ? totalSales[0].total : 0,
    soldItems,
    notSoldItems,
  });
};

const getBarChart = async (req, res) => {
  const { month } = req.query;
  const ranges = [
    [0, 100],
    [101, 200],
    [201, 300],
    [301, 400],
    [401, 500],
    [501, 600],
    [601, 700],
    [701, 800],
    [801, 900],
    [901, Infinity],
  ];
  const barChartData = await Promise.all(
    ranges.map(async ([min, max]) => {
      const count = await Transaction.countDocuments({
        dateOfSale: { $regex: `-${month}-` },
        price: { $gte: min, $lt: max },
      });
      return { range: `${min}-${max}`, count };
    })
  );
  res.status(200).json(barChartData);
};

const getPieChart = async (req, res) => {
  const { month } = req.query;
  const pieChartData = await Transaction.aggregate([
    { $match: { dateOfSale: { $regex: `-${month}-` } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  res.status(200).json(pieChartData);
};

const getCombinedData = async (req, res) => {
  const { month } = req.query;
  const transactions = await Transaction.find({
    dateOfSale: { $regex: `-${month}-` },
  });
  const statistics = await getStatistics(req, res);
  const barChart = await getBarChart(req, res);
  const pieChart = await getPieChart(req, res);
  res.status(200).json({ transactions, statistics, barChart, pieChart });
};

module.exports = {
  initializeDatabase,
  getTransactions,
  getStatistics,
  getBarChart,
  getPieChart,
  getCombinedData,
};
