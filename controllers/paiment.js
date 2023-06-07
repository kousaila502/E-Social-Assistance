const Budget = require('../models/budgetPool');
const Paiment = require('../models/paiment');
const Demande = require('../models/demande');
const Chapitre = require('../models/chapitre');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const multer = require('multer');
const chapitre = require('../models/chapitre');

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

const createDemandeTrans = async (req, res) => {
    const { id: demandeId } = req.params;
    const { montant, fieldId , doc} = req.body;
    /*let files = "";
    if(req.file){
       files = req.file.path; 
    }*/
    
    /*const chapitre = await Chapitre.findById(fieldId);
    let budgetPool = "";
    if(!chapitre){
      
    }else{
      const budgetPool = chapitre.budgetPool;
    }*/
    const budgetPool = "645e5f1aecbc3c7a336f017a";

     const demande = await Demande.findOneAndUpdate({ _id: demandeId }, { status: "paid"}, {
    new: true,
    runValidators: true,
  });
    if (!demande) {
      throw new CustomError.NotFoundError(`No demande with id : ${demandeId}`);
    }
    const existingBudget = await Budget.findById(budgetPool);

    if (!existingBudget) {
        throw new CustomError.NotFoundError(`No budget pool with id : ${budgetPool}`);
    }

    if(montant<=existingBudget.remaining){
        await Budget.findOneAndUpdate({ _id: budgetPool }, { $inc: { remaining: -montant } }, {
        new: true,
        runValidators: true,
        });

        const trans = await Paiment.create({
            destination: {
              type: 'User',
              id: demande.user,
            },
            montant: montant,
            source: budgetPool,
            demande: demandeId,
            files: doc
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
    getSingleTrans,
    upload
};
