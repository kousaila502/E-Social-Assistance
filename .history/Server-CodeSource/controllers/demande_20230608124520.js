const Demande = require('../models/demande');
const Notification = require('../models/notifiacation');

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const { checkPermissions } = require('../utils/checkPermissions');


const createDemande = async (req, res) => {
  const { description, sousChapitreId, requestMontant , doc} = req.body;

  const data = {};

  data.user = req.user.userId;
  const field = {type: 'Sous_chapitre', id: sousChapitreId};
  data.field = field
  if(requestMontant){
    data.requestMontant = requestMontant;
  }
  if(description){
    data.description = description;
  }
  if(doc){
    data.files = doc;
  }

  
  const demande = await Demande.create(data);
  res.status(StatusCodes.CREATED).json({ demande });
};

const getAllDemande = async (req, res) => {
  const { status } = req.query;
  const queryObject = {};

  if(status){
    queryObject.status = status;
  }
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await Demande.find(queryObject).skip(skip).limit(limit).populate('user').sort('-createdAt');

  const totalCount = await Demande.countDocuments(queryObject);
  res.status(StatusCodes.OK).json({ result, count: result.length , totalCount });
};
const getMyDemandes = async (req, res) => {
  const userId = req.user.userId;
  const demandes = await Demande.find({user: userId });

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

  const demande = await Demande.findOne({ _id: demandeId, user: req.user.userId });

  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id: ${demandeId}`);
  }

  if (demande.status !== 'pending') {
    res.status(StatusCodes.BAD_REQUEST).json({ error: 'Cannot update a demande that is not in pending status' });
    return;
  }

  const updatedDemande = await Demande.findOneAndUpdate(
    { _id: demandeId, user: req.user.userId },
    req.body,
    { new: true, runValidators: true }
  );

  res.status(StatusCodes.OK).json({ demande: updatedDemande });
};
const updateDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  const status = req.body.status;
  const motif = req.body.motif

  const demande = await Demande.findOneAndUpdate({ _id: demandeId }, { status , motif}, {
    new: true,
    runValidators: true,
  });

  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
  }

  if(req.body.status == "accepted"){
    const notification = await Notification.create(
      {user: demande.user,
       demande: demandeId,
       description: "your demande is accepted"});

    res.status(StatusCodes.OK).json({ demande, notification });
  }
  if(req.body.status == "rejected"){
    const notification = await Notification.create(
      {user: demande.user,
       demande: demandeId,
       description: "your demande is rejected"});

    res.status(StatusCodes.OK).json({ demande, notification });
  }

  res.status(StatusCodes.OK).json({ demande });
};




module.exports = {
  createDemande,
  getAllDemande,
  getMyDemandes,
  getSingleDemande,
  getMySingleDemande,
  updateDemande,
  updateMyDemande
};
