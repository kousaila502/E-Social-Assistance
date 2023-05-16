const SousChapitre = require('../models/sous-chapitre');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createSousChapitre = async (req, res) => {
  const sousChapitre = await SousChapitre.create(req.body);
  res.status(StatusCodes.CREATED).json({ sousChapitre });
};
const getAllSousChapitres = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await SousChapitre.find({}).skip(skip).limit(limit);

  res.status(StatusCodes.OK).json({ result, count: result.length });
};
const getSingleSousChapitre = async (req, res) => {
  const { id: chapitreId } = req.params;

  const sousChapitre = await SousChapitre.findOne({ _id: chapitreId });

  if (!sousChapitre) {
    throw new CustomError.NotFoundError(`No sous chapitre with id : ${chapitreId}`);
  }

  res.status(StatusCodes.OK).json({ sousChapitre });
};
const updateSousChapitre = async (req, res) => {
  const { id: souChapitreId } = req.params;
  const sousChapitre = await SousChapitre.findOneAndUpdate({ _id: souChapitreId }, req.body , {
    new: true,
    runValidators: true,
  });

  if (!sousChapitre) {
    throw new CustomError.NotFoundError(`No sous chapitre with id : ${souChapitreId}`);
  }

  res.status(StatusCodes.OK).json({ sousChapitre });
};




module.exports = {
    createSousChapitre,
    getAllSousChapitres,
    getSingleSousChapitre,
    updateSousChapitre
};
