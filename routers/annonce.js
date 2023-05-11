const express = require("express");
const router = express.Router();
const {
    authenticateUser,
    authorizePermissions,
} = require('../middleware/authentication');
const {
    createAnnonce,
    getAllAnnonce,
    getSingleAnnonce,
    updateAnnonce,
    getAllEmpInscrit,
    getMyAnnonces,
    suscribeAnnonce,
    admisAnnonce,
    desuscribeAnnonce,
    getAllEmpAdmis,
    getWinners
} = require('../controllers/annonce');

// admin end points
router
    .post("/admin/createAnnonce",[authenticateUser, authorizePermissions('admin')], createAnnonce)
router
    .get("/admin/getAllAnnonce",[authenticateUser, authorizePermissions('admin')], getAllAnnonce)
router
    .get("/admin/getSingleAnnonce/:id",[authenticateUser, authorizePermissions('admin')], getSingleAnnonce)
router
    .put("/admin/updateAnnonce/:id",[authenticateUser, authorizePermissions('admin')], updateAnnonce)
router
    .get("/admin/getAllEmpInscrit/:id",[authenticateUser, authorizePermissions('admin')], getAllEmpInscrit)
router
    .post("/admin/admisAnnonce/:id",[authenticateUser, authorizePermissions('admin')], admisAnnonce)
router
    .get("/admin/getAllEmpAdmis/:id",[authenticateUser, authorizePermissions('admin')], getAllEmpAdmis)
router
    .get("/admin/getWinners",[authenticateUser, authorizePermissions('admin')], getWinners)

// employers end points
router
    .get("/emp/getAllAnnonce/", authenticateUser, getAllAnnonce)
router
    .get("/emp/getSingleAnnonce/:id", authenticateUser, getSingleAnnonce)
router
    .get("/emp/getMyAnnonce", authenticateUser, getMyAnnonces)
router
    .post("/emp/suscribeAnnonce/:id", authenticateUser, suscribeAnnonce)
router
    .delete("/emp/desuscribeAnnonce/:id", authenticateUser, desuscribeAnnonce)

module.exports = router;

