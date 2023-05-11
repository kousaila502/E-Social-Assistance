const Chapitre = require('../models/chapitre');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createChapitre = async (req, res) => {
  const chapitre = await Chapitre.create(req.body);
  res.status(StatusCodes.CREATED).json({ chapitre });
};
const getAllChapitres = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await Chapitre.find({}).skip(skip).limit(limit);

  res.status(StatusCodes.OK).json({ result, count: result.length });
};
const getSingleChapitre = async (req, res) => {
  const { id: chapitreId } = req.params;

  const chapitre = await Chapitre.findOne({ _id: chapitreId });

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
