const Programme = require('../models/programme');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createProgramme = async (req, res) => {
  const programme = await Programme.create(req.body);
  res.status(StatusCodes.CREATED).json({ programme });
};
const getProgramme = async (req, res) => {

  const programme = await Programme.find({});

  if (!programme) {
    throw new CustomError.NotFoundError(`No programme exist...`);
  }

  res.status(StatusCodes.OK).json({ programme });
};


module.exports = {
    createProgramme,
    getProgramme
};
