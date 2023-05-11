const Article = require('../models/article');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createArticle = async (req, res) => {
  const article = await Article.create(req.body);
  res.status(StatusCodes.CREATED).json({ article });
};
const getAllArticles = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await Article.find({}).skip(skip).limit(limit);

  res.status(StatusCodes.OK).json({ result, count: result.length });
};
const getSingleArticle = async (req, res) => {
  const { id: articleId } = req.params;

  const article = await Article.findOne({ _id: articleId });

  if (!article) {
    throw new CustomError.NotFoundError(`No article with id : ${articleId}`);
  }

  res.status(StatusCodes.OK).json({ article });
};
const updateArticle = async (req, res) => {
  const { id: articleId } = req.params;
  const article = await Article.findOneAndUpdate({ _id: articleId }, req.body , {
    new: true,
    runValidators: true,
  });

  if (!article) {
    throw new CustomError.NotFoundError(`No article with id : ${articleId}`);
  }

  res.status(StatusCodes.OK).json({ article });
};




module.exports = {
    createArticle,
    getAllArticles,
    getSingleArticle,
    updateArticle
};
