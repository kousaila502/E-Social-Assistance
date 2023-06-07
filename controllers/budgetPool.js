const Budget = require('../models/budgetPool');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createBudget = async (req, res) => {
  const budget = await Budget.create(req.body);
  res.status(StatusCodes.CREATED).json({ budget });
};

const updateBudget = async (req, res) => {
  const { id: budgetId } = req.params;
  const budget = await Budget.findOneAndUpdate({ _id: budgetId }, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(StatusCodes.CREATED).json({ budget });
};
const getBudget = async (req, res) => {
  const budget = await Budget.find({});

  res.status(StatusCodes.OK).json({ budget});
};
const getSingleBudget = async (req, res) => {
  const { id: budgetId } = req.params
  const budget = await Budget.findById(budgetId);

  if (!budget) {
    throw new CustomError.NotFoundError(`No budget pool with id : ${budgetId}`);
  }

  res.status(StatusCodes.OK).json({ budget});
};
const pushBudget = async (req, res) => {
  const { id: budgetId } = req.params;
  const { montant } = req.body;
  const budget = await Budget.findOneAndUpdate({ _id: budgetId }, { $inc: { montant: montant , remaining: montant } }, {
    new: true,
    runValidators: true,
  });

  if (!budget) {
    throw new CustomError.NotFoundError(`No budget pool with id : ${budgetId}`);
  }

  res.status(StatusCodes.OK).json({ budget });
};
const popBudget = async (req, res) => {
  const { id: budgetId } = req.params;
  const {montant} = req.body;
  const existingBudget = await Budget.findById(budgetId);

  if (!existingBudget) {
    throw new CustomError.NotFoundError(`No budget pool with id : ${budgetId}`);
  }

  if(montant<=existingBudget.remaining){
    const budget = await Budget.findOneAndUpdate({ _id: budgetId }, { $inc: { remaining: -montant } }, {
      new: true,
      runValidators: true,
    });
    res.status(StatusCodes.OK).json({ budget });
  }else{
    throw new CustomError.BadRequestError(`Budget insuffisant...`);
  }
  
};


module.exports = {
    getBudget,
    pushBudget,
    popBudget,
    createBudget,
    getSingleBudget,
    updateBudget
};
