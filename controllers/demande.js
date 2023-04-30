const Demande = require('../models/demande');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const { checkPermissions } = require('../utils/checkPermissions');

const createDemande = async (req, res) => {
  req.body.user = req.user.userId;
  const demande = await Demande.create(req.body);
  res.status(StatusCodes.CREATED).json({ demande });
};
const getAllDemande = async (req, res) => {
  const demandes = await Demande.find({});

  res.status(StatusCodes.OK).json({ demandes, count: demandes.length });
};
const getMyDemandes = async (req, res) => {
  const userId = req.user.userId;
  const demandes = await Demande.find({user: userId, status: false });

  res.status(StatusCodes.OK).json({ demandes, count: demandes.length });
};
const getSingleDemande = async (req, res) => {
  const { id: demandeId } = req.params;

  const demande = await Demande.findOne({ _id: demandeId }).populate('user');

  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
  }

  res.status(StatusCodes.OK).json({ demande });
};
const getMySingleDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  
  const demande = await Demande.findOne({ _id: demandeId }).select('-user');

  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
  }
  checkPermissions(req.user,demande.user);

  res.status(StatusCodes.OK).json({ demande });
};
const updateMyDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  const demande = await Demande.findOneAndUpdate({ _id: demandeId, user: req.user.userId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
  }

  res.status(StatusCodes.OK).json({ demande });
};
const updateDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  const demande = await Demande.findOneAndUpdate({ _id: demandeId }, { status: req.body.status }, {
    new: true,
    runValidators: true,
  });

  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
  }

  res.status(StatusCodes.OK).json({ demande });
};
const deleteMyDemande = async (req, res) => {
  const { id: demandeId } = req.params;

  const demande = await Demande.findOne({ _id: demandeId });

  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
  }
  checkPermissions(req.user,demande.user);

  if (demande.status !== 'paied') {
    throw new CustomError.BadRequestError(`You can't delete your demande till the end of the process..`);
  }
  
  demande.cacher = true;
  await demande.save();
  res.status(StatusCodes.OK).json({ msg: 'Success! demande cached.' });
};



module.exports = {
  createDemande,
  getAllDemande,
  getMyDemandes,
  getSingleDemande,
  getMySingleDemande,
  updateDemande,
  updateMyDemande,
  deleteMyDemande,
};
