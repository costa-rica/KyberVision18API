// const { Action } = require('../models');
const { Action } = require("kybervision18db");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");

// //? Route pour récupérer toutes les actions
// router.get("/", authenticateToken, async (req, res) => {
//   try {
//     const actions = await Action.findAll();
//     res.status(200).json(actions);
//   } catch (error) {
//     res.status(500).json({
//       error: "Erreur lors de la récupération des actions",
//       details: error.message,
//     });
//   }
// });

// //? Route pour récupérer une action par ID
// router.get("/:id", authenticateToken, async (req, res) => {
//   const { id } = req.params;
//   try {
//     const action = await Action.findByPk(id);
//     if (!action) {
//       return res.status(404).json({ error: "Action non trouvée" });
//     }
//     res.status(200).json(action);
//   } catch (error) {
//     res.status(500).json({
//       error: "Erreur lors de la récupération de l'action",
//       details: error.message,
//     });
//   }
// });

// //? Route pour mettre à jour le Timestamp d'une action
// router.patch("/:id/timestamp", authenticateToken, async (req, res) => {
//   const { id } = req.params;
//   const { Timestamp } = req.body;

//   if (Timestamp === undefined) {
//     return res.status(400).json({ error: "Le champ Timestamp est requis" });
//   }

//   try {
//     const action = await Action.findByPk(id);
//     if (!action) {
//       return res.status(404).json({ error: "Action non trouvée" });
//     }

//     action.Timestamp = Timestamp;
//     await action.save();

//     res.status(200).json(action);
//   } catch (error) {
//     res.status(500).json({
//       error: "Erreur lors de la mise à jour du Timestamp de l'action",
//       details: error.message,
//     });
//   }
// });

// //? Route pour récupérer les actions en rapport avec un SyncContract
// router.get(
//   "/sync-contract/:syncContractId",
//   authenticateToken,
//   async (req, res) => {
//     const { syncContractId } = req.params;
//     try {
//       const actions = await Action.findAll({
//         where: { Sync_Contract_ID: syncContractId },
//       });
//       res.status(200).json(actions);
//     } catch (error) {
//       res.status(500).json({
//         error:
//           "Erreur lors de la récupération des actions pour le SyncContract",
//         details: error.message,
//       });
//     }
//   }
// );

//? Route pour créer une nouvelle action
/*
retirer Complex_ID et Point_ID si l'id n'existe pas
curl -X POST http://localhost:5000/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "Complex_ID": 1,
    "Point_ID": 1,
    "Sync_Contract_ID": 1,
    "Player_ID": 1,
    "Type": 2,
    "SubType": 3,
    "Quality": "+",
    "Timestamp": 200.0,
    "Zone": "P4"
  }'
*/
// router.post("/", authenticateToken, async (req, res) => {
//   const {
//     Complex_ID,
//     Point_ID,
//     Sync_Contract_ID,
//     Player_ID,
//     Type,
//     SubType,
//     Quality,
//     Timestamp,
//     Zone,
//   } = req.body;
//   try {
//     const newAction = await Action.create({
//       Complex_ID,
//       Point_ID,
//       Sync_Contract_ID,
//       Player_ID,
//       Type,
//       SubType,
//       Quality,
//       Timestamp,
//       Zone,
//     });
//     res.status(201).json(newAction);
//   } catch (error) {
//     res.status(500).json({
//       error: "Erreur lors de la création de l'action",
//       details: error.message,
//     });
//   }
// });

// #########################################################
// -----  Routes created specfically for Mobile -----------
// #########################################################

module.exports = router;
