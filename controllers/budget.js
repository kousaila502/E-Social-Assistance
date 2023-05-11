const Budget = require('../models/budget');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createBudget = async (req, res) => {
  const {montant} = req.body
  const budget = await Budget.create({montant});
  res.status(StatusCodes.CREATED).json({ budget });
};
const getBudget = async (req, res) => {
  const budget = await Budget.find({});

  res.status(StatusCodes.OK).json({ budget});
};
const pushBudget = async (req, res) => {
  const { id: budgetId } = req.params;
  const budget = await Budget.findOneAndUpdate({ _id: budgetId }, {montant: +montant}, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ demande });
};
const popBudget = async (req, res) => {
  const { id: budgetId } = req.params;
  const {montant} = req.body;
  const existingBudget = await Budget.findById(budgetId);
  if(montant<=existingBudget){
    const budget = await Budget.findOneAndUpdate({ _id: budgetId }, {montant: -montant}, {
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
    createBudget
};
