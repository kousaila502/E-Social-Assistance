const Annonce = require('../models/annonce');
const Demande = require('../models/demande');
const Notification = require('../models/notifiacation');
const AnnonceEmpInscrits = require('../models/annonceEmpInscrits');
const AnnonceEmpAdmis = require('../models/annonceEmpAdmis');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createAnnonce = async (req, res) => {
    const annonce = await Annonce.create(req.body);
    res.status(StatusCodes.CREATED).json({ annonce });
  };

const getAllAnnonce = async (req, res) => {

    const { status } = req.query;
    const queryObject = {};
  
    if(status){
      queryObject.status = status;
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
  
    const result = await Annonce.find(queryObject).skip(skip).limit(limit).sort('-createdAt');
  
    const totalCount = await Annonce.countDocuments(queryObject);
    res.status(StatusCodes.OK).json({ result, count: result.length , totalCount });

};

const getSingleAnnonce = async (req, res) => {
    const { id: annonceId } = req.params;
  
    const annonce = await Annonce.findOne({ _id: annonceId });

    const empInscrits = await AnnonceEmpInscrits.find({ annonce: annonceId  }).populate('emplInscrits');
    const emplAdmis = await AnnonceEmpAdmis.find({ annonce: annonceId }).populate('empAdmis');
  
    if (!annonce) {
      throw new CustomError.NotFoundError(`No annonce with id : ${annonceId}`);
    }
  
    res.status(StatusCodes.OK).json({ annonce, empInscrits, emplAdmis });
  };


const updateAnnonce = async (req, res) => {
    const annonce = await Annonce.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true,
    });
    if (!annonce) {
        throw new CustomError.NotFoundError(`No annonce with id : ${req.params.id}`);
    }

    res.status(StatusCodes.OK).json({ annonce });
};

const getMyAnnonces = async (req, res) => {
    const userId = req.user.userId;
    const annonces = await AnnonceEmpInscrits.find({emplInscrits: userId }).populate("annonce");
  
    res.status(StatusCodes.OK).json({ annonces, count: annonces.length });
  };

const suscribeAnnonce = async (req, res) => {
    const userId = req.user.userId;
    const annonceId = req.params.id;

    const annonce = await AnnonceEmpInscrits.create({ annonce: annonceId, emplInscrits: userId });
    if (!annonce) {
        throw new CustomError.NotFoundError(`No annonce with id : ${annonceId}`);
    }

    res.status(StatusCodes.OK).json({ annonce });
};
const desuscribeAnnonce = async (req, res) => {
    const userId = req.user.userId;
    const annonceId = req.params.id;


    const win = await AnnonceEmpAdmis.findOne({ annonce: annonceId, emplAdmis: userId });

    if (win) {
        throw new CustomError.BadRequestError(`You can't unsubscribe now you has been selected.`);
    }

    const annonce = await AnnonceEmpInscrits.findOne({ annonce: annonceId, emplInscrits: userId });

    if (!annonce) {
        throw new CustomError.NotFoundError(`No annonce found for id: ${annonceId} and user id: ${userId}`);
    }

    if (annonce.status !== 'pending') {
        throw new CustomError.BadRequestError(`You can't unsubscribe now your inscription has been rejected.`);
    }

    await annonce.deleteOne();

    res.status(StatusCodes.OK).json({ message: `User ${userId} unsubscribed from annonce ${annonceId}.` });
};


const getAllEmpInscrit = async (req, res) => {
    const annonceId = req.params.id;

    const empInscrits = await AnnonceEmpInscrits.find({ annonce: annonceId  }).populate('emplInscrits');

    if (!empInscrits) {
        throw new CustomError.NotFoundError(`No annonce with id : ${annonceId}`);
    }

    res.status(StatusCodes.OK).json({ empInscrits });
};

const admisAnnonce = async (req, res) => {
    const admisArray = req.body; 
    const idAnnonce = req.params.id;
  
    const annonces = [];
    const notifications = [];
    const demandes = [];
  
    for (const admis of admisArray) {
      const { idEmpAdmis } = admis;
  
      const annonce = await AnnonceEmpAdmis.create({ annonce: idAnnonce, empAdmis: idEmpAdmis });
      await AnnonceEmpInscrits.findOneAndDelete({ annonce: idAnnonce, emplInscrits: idEmpAdmis });
  
      if (!annonce) {
        throw new CustomError.NotFoundError(`No annonce with id: ${req.params.id}`);
      }
  
      const demande = await Demande.create({
        description: `Winning in annonce: ${idAnnonce}`,
        status: 'accepted',
        user: idEmpAdmis,
        field: { type: 'Annonce', id: idAnnonce }
      });
  
      const notification = await Notification.create({
        description: `Winning in annonce: ${idAnnonce}`,
        user: idEmpAdmis,
        anounce: idAnnonce
      });
  
      annonces.push(annonce);
      notifications.push(notification);
      demandes.push(demande);
    }
  
    res.status(StatusCodes.OK).json({ annonces, notifications, demandes });
  };
  

const getAllEmpAdmis = async (req, res) => {
    const annonceId = req.params.id;

    const emplAdmis = await AnnonceEmpAdmis.find({ annonce: annonceId }).populate('empAdmis');

    if (!emplAdmis) {
        throw new CustomError.NotFoundError(`No annonce with id : ${annonceId}`);
    }

    res.status(StatusCodes.OK).json({ emplAdmis });
};

const getWinners = async (req, res) => {

    const emplAdmis = await AnnonceEmpAdmis.find({}).populate('emplAdmis');

    res.status(StatusCodes.OK).json({ emplAdmis });
};

module.exports = {
    createAnnonce,
    getAllAnnonce,
    getSingleAnnonce,
    updateAnnonce,
    getAllEmpInscrit,
    getMyAnnonces,
    suscribeAnnonce,
    desuscribeAnnonce,
    admisAnnonce,
    getAllEmpAdmis,
    getWinners
};