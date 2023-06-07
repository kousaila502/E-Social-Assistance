const SousChapitre = require('../models/sous-chapitre');
const Chapitre = require('../models/chapitre');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createSousChapitre = async (req, res) => {
  const {nom, text, chapitreId} = req.body
  const sousChapitre = await SousChapitre.create({nom, text, chapitre: chapitreId});

  const chapitre = await Chapitre.findOneAndUpdate(
    { _id: chapitreId },
    { $push: { sous_chapitre: sousChapitre._id } },
    { new: true }
  );

  if (!chapitre) {
    throw new CustomError.NotFoundError(`No chapitre with id: ${chapitreId}`);
  }
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

  const sousChapitre = await SousChapitre.findOne({ _id: chapitreId }).populate('article');

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

const updateStatusSousChapitre = async (req, res) => {
  const updates = req.body; // Assuming req.body is an array of updates

  const updatedSousChapitres = await Promise.all(
    updates.map(async (update) => {
      const { _id, status } = update;
      const sousChapitre = await SousChapitre.findByIdAndUpdate(
        _id,
        { $set: { status } },
        { new: true, runValidators: true }
      );

      if (!sousChapitre) {
        throw new CustomError.NotFoundError(`No sous chapitre with id: ${_id}`);
      }

      return sousChapitre;
    })
  );

  res.status(StatusCodes.OK).json({ sousChapitres: updatedSousChapitres });
};






module.exports = {
    createSousChapitre,
    getAllSousChapitres,
    getSingleSousChapitre,
    updateSousChapitre,
    updateStatusSousChapitre
};
