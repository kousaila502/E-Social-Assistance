const { StatusCodes } = require('http-status-codes');
const User = require('../models/user')
const CustomError = require('../errors');
const crypto = require('crypto');

const {
    attachCookiesToResponse
  } = require('../utils/jwt');
const sendResetPasswordEmail = require('../utils/sendResetPasswordEmail');

const register = async (req, res) => {
   
    const { email, name, password , phoneNumber, type} = req.body;
   
    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
      throw new CustomError.BadRequestError('Email already exists');
    }
  
    // first registered user is an admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';
  
    const user = await User.create({
      name,
      email,
      password,
      role,
      phoneNumber,
      type
    });
  
    res.status(StatusCodes.CREATED).json(user);
  };

  const login = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      throw new CustomError.BadRequestError('Please provide email and password');
    }
    const user = await User.findOne({ email });
  
    if (!user) {
      throw new CustomError.UnauthenticatedError('User Not Found!');
    }
    const isPasswordCorrect = await user.comparePassword(password);
  
    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError('Wrong Password!');
    }
   /**  if (!user.isVerified) {
      throw new CustomError.UnauthenticatedError('Please verify your email');
    }*/
  
    // create refresh token  
    refreshToken = crypto.randomBytes(40).toString('hex');
  
    attachCookiesToResponse({ res, user, refreshToken });
  
    res.status(StatusCodes.OK).json({ user });
  };

  const logout =  (req, res) => {
  
    res.cookie('accessToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
    res.cookie('refreshToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
    res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
  };


  const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      throw new CustomError.BadRequestError('Please provide valid email');
    }
  
    const user = await User.findOne({ email });
  
    if (user) {
      const origin = 'http://localhost:3000';
      await sendResetPasswordEmail({
        name: user.name,
        email: user.email,
        origin,
      });
    }
  
    res
      .status(StatusCodes.OK)
      .json({ msg: 'Please check your email for reset password link' });
  };

module.exports = {
    register,
    login,
    logout,
    forgotPassword};