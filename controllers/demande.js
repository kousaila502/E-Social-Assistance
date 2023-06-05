const Demande = require('../models/demande');
const Notification = require('../models/notifiacation');

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const multer = require('multer')

const { checkPermissions } = require('../utils/checkPermissions');


const storage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, './uploads/')
  },
  filename: (req, file, cb)=>{
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const acceptableExtensions = ['pdf']
    if (!(acceptableExtensions.some(extension => 
        path.extname(file.originalname).toLowerCase() === `.${extension}`)
    )) {
        return callback(new CustomError.BadRequestError(`Extension not allowed, accepted extensions are ${acceptableExtensions.join(',')}`))
    }
    callback(null, true)
  }
});

const createDemande = async (req, res) => {
  req.body.user = req.user.userId;
  req.body.files = req.file.path;
  const demande = await Demande.create(req.body);
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

  const result = await Demande.find(queryObject).skip(skip).limit(limit).populate('user');

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
  updateMyDemande,
  upload
};
