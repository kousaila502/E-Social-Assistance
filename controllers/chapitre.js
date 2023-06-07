const Chapitre = require('../models/chapitre');
const Budget = require('../models/budgetPool');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createChapitre = async (req, res) => {
  const {montant, nom, text} = req.body;
  const existingBudget = await Budget.findOne({_id: "645e5dfdecbc3c7a336f0177"})
  if(montant<=existingBudget.remaining){
  const budget = await Budget.create({montant, description: text});
  await Budget.findOneAndUpdate({ _id: "645e5dfdecbc3c7a336f0177" }, { $inc: { remaining: -montant } }, {
    new: true,
    runValidators: true,
  });
  const chapitre = await Chapitre.create({nom, text, budgetPool: budget._id});

  res.status(StatusCodes.CREATED).json({ chapitre });
  }else{
    throw new CustomError.BadRequestError(`Budget insuffisant...`);
}
};
const getAllChapitres = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await Chapitre.find({}).skip(skip).limit(limit).populate('budgetPool');

  res.status(StatusCodes.OK).json({ result, count: result.length });
};
const getSingleChapitre = async (req, res) => {
  const { id: chapitreId } = req.params;

  const chapitre = await Chapitre.findOne({ _id: chapitreId })
  .populate({
    path: 'sous_chapitre',
    populate: {
      path: 'article'
    }
  });

  if (!chapitre) {
    throw new CustomError.NotFoundError(`No chapitre with id : ${chapitreId}`);
  }

  res.status(StatusCodes.OK).json({ chapitre });
};
const updateChapitre = async (req, res) => {
  const { id: chapitreId } = req.params;
  const chapitre = await Chapitre.findOneAndUpdate({ _id: chapitreId }, req.body , {
    new: true,
    runValidators: true,
  });

  if (!chapitre) {
    throw new CustomError.NotFoundError(`No chapitre with id : ${chapitreId}`);
  }

  res.status(StatusCodes.OK).json({ chapitre });
};




module.exports = {
    createChapitre,
    getAllChapitres,
    getSingleChapitre,
    updateChapitre
};
