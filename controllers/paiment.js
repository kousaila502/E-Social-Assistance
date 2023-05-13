const Budget = require('../models/budgetPool');
const Paiment = require('../models/paiment');
const Demande = require('../models/demande');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createDemandeTrans = async (req, res) => {
    const { id: demandeId } = req.params;
    const { mode, nPiece, budgetPool } = req.body;
  
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
    }
    
    const existingBudget = await Budget.findById(budgetPool);

    if (!existingBudget) {
        throw new CustomError.NotFoundError(`No budget pool with id : ${budgetPool}`);
    }

    if(demande.montant<=existingBudget.remaining){
        await Budget.findOneAndUpdate({ _id: budgetPool }, { $inc: { remaining: -demande.montant } }, {
        new: true,
        runValidators: true,
        });

        const trans = await Paiment.create({
            mode,
            nPiece,
            destination: {
              type: 'User',
              id: demande.user,
            },
            source: {
              type: 'BudgetPool',
              id: budgetPool,
            },
            demande: demandeId,
          });

          res.status(StatusCodes.CREATED).json({ trans });
    }else{
        throw new CustomError.BadRequestError(`Budget insuffisant...`);
    }

};

const createEnterPoolTrans = async (req, res) => {
  const { budgetPoolDes, budgetPoolSrc, montant, mode, nPiece } = req.body;

  
  const existingSrcBudget = await Budget.findById(budgetPoolSrc);
  const existingDesBudget = await Budget.findById(budgetPoolDes);

  if (!existingSrcBudget) {
      throw new CustomError.NotFoundError(`No budget pool with id : ${budgetPoolSrc}`);
  }
  if (!existingDesBudget) {
    throw new CustomError.NotFoundError(`No budget pool with id : ${budgetPoolDes}`);
  }

  if(montant<=existingSrcBudget.remaining){
      await Budget.findOneAndUpdate({ _id: budgetPoolSrc }, { $inc: { remaining: -montant } }, {
      new: true,
      runValidators: true,
      });

      await Budget.findOneAndUpdate({ _id: budgetPoolDes }, { $inc: { montant: montant , remaining: montant } }, {
        new: true,
        runValidators: true,
      });

      const trans = await Paiment.create({
          mode,
          nPiece,
          destination: {
            type: 'BudgetPool',
            id: budgetPoolDes,
          },
          source: {
            type: 'BudgetPool',
            id: budgetPoolSrc,
          }
        });

        res.status(StatusCodes.CREATED).json({ trans });
  }else{
      throw new CustomError.BadRequestError(`Budget insuffisant...`);
  }

};
    
const getTrans = async (req, res) => {
  const trans = await Paiment.find({});

  res.status(StatusCodes.OK).json({ trans ,  count: trans.length});
};
const getSingleTrans = async (req, res) => {
  const { id: transId } = req.params
  const paiment = await Paiment.findById(transId);

  if (!paiment) {
    throw new CustomError.NotFoundError(`No trans with id : ${transId}`);
  }

  res.status(StatusCodes.OK).json({ paiment});
};
const updateTrans = async (req, res) => {
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


module.exports = {
    getTrans,
    updateTrans,
    createDemandeTrans,
    createEnterPoolTrans,
    getSingleTrans
};
