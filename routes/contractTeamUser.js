const {
  User,
  ContractTeamUser,
  Team,
  ContractTeamPlayer,
  ContractPlayerUser,
} = require("kybervision17db");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");
const jwt = require("jsonwebtoken");

// NOTE: This it the "Tribe" router. Formerly GroupContract
/// --> would be the groups.js file in KV15API

// GET /contract-team-user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`userId: ${userId}`);
    // const groups = await GroupContract.findAll({ where: { userId } });
    const contractTeamUsers = await ContractTeamUser.findAll({
      where: { userId },
      include: {
        model: Team,
        //attributes: ["id", "teamName", "city", "coachName"], // specify fields you want
      },
    });
    // console.log(" --- contractTeamUsers ------");
    // console.log(contractTeamUsers[0].dataValues);
    // console.log(" -----------------------------");

    // const teamsArray = groupContracts.map((gc) => gc.Team);
    const teamsArray = await Promise.all(
      contractTeamUsers.map(async (ctu) => {
        const team = ctu.Team.toJSON(); // convert to plain object
        const joinToken = jwt.sign(
          { teamId: team.id },
          process.env.JWT_SECRET,
          {
            expiresIn: "2d",
          }
        );
        // team.joinUrlGeneric = `${process.env.URL_BASE_KV_API}/contract-team-user/join/${joinToken}`;
        team.genericJoinToken = joinToken;
        // // Add a practice Match
        // const practiceMatch = await Session.findOne({
        //   where: {
        //     teamId: team.id,
        //     //   teamIdOpponent: team.id,
        //     // city: "practice",
        //   },
        //   order: [["sessionDate", "DESC"]],
        // });
        // team.practiceMatch = practiceMatch;
        return team;
      })
    );
    const contractTeamUserArrayModified = await Promise.all(
      contractTeamUsers.map(async (ctu) => {
        const { Team, ...ctuData } = ctu.get();
        return ctuData;
      })
    );

    // console.log(teamsArray);

    res.status(200).json({
      teamsArray,
      contractTeamUserArray: contractTeamUserArrayModified,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error retrieving contractTeamUsers",
      details: error.message,
    });
  }
});

// POST contract-team-user/create/:teamId
router.post("/create/:teamId", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    const { isSuperUser, isAdmin, isCoach } = req.body;
    // create or modify contract team user
    const [contractTeamUser, created] = await ContractTeamUser.upsert(
      { userId, teamId, isSuperUser, isAdmin, isCoach },
      { returning: true }
    );
    // res.status(201).json(group);
    res.status(created ? 201 : 200).json({
      message: created
        ? "ContractTeamUser created with success"
        : "ContractTeamUser updated with success",
      contractTeamUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error creating or updating contractTeamUser",
      details: error.message,
    });
  }
});

// GET /contract-team-user/:teamId
router.get("/:teamId", authenticateToken, async (req, res) => {
  console.log("------- > accessed GET /contract-team-user/:teamId");
  try {
    const teamId = req.params.teamId;
    console.log(`teamId: ${teamId}`);
    const contractTeamUser = await ContractTeamUser.findAll({
      where: { teamId },
      include: {
        model: User,
        attributes: ["id", "username", "email"], // specify fields you want
        include: {
          model: ContractPlayerUser,
        },
      },
    });

    // console.log(JSON.stringify(contractTeamUser, null, 2));

    const squadArray = contractTeamUser.map((ctu) => {
      const { User, ...ctuData } = ctu.get();

      return {
        ...ctuData, // Extract raw contractTeamUser data
        userId: User.id,
        username: User.username,
        email: User.email,
        isPlayer: User.ContractPlayerUser ? true : false,
        playerId: User.ContractPlayerUser?.playerId,
      };
    });

    const contractTeamPlayerArray = await ContractTeamPlayer.findAll({
      where: { teamId },
    });
    const contractTeamPlayerIds = contractTeamPlayerArray.map(
      (ctp) => ctp.playerId
    );
    const contractPlayerUserArray = await ContractPlayerUser.findAll({
      where: { playerId: contractTeamPlayerIds },
    });

    const squadArrayWithPlayerFlag = squadArray.map((squadMember) => {
      // const { User, ...ctuData } = ctu.get();
      return {
        ...squadMember, // Extract raw contractTeamUser data
        isPlayer: contractPlayerUserArray.some(
          (cpu) => cpu.userId === squadMember.userId
        ),
      };
    });

    res.status(200).json({ squadArray: squadArrayWithPlayerFlag });
  } catch (error) {
    res.status(500).json({
      error: "Error retrieving contractTeamUser",
      details: error.message,
    });
  }
});

// POST /contract-team-user/add-squad-member
router.post("/add-squad-member", authenticateToken, async (req, res) => {
  console.log("------- > accessed POST /contract-team-user/add-squad-member");
  try {
    const { teamId, email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        error: "User not found. Please have this email register first.",
      });
    }
    const contractTeamUser = await ContractTeamUser.create({
      teamId,
      userId: user.id,
    });
    res.status(201).json(contractTeamUser);
  } catch (error) {
    res.status(500).json({
      error: "Error adding squad member",
      details: error.message,
    });
  }
});

// NOT currently being used
// GET /contract-team-user/create-join-token/:teamId
router.get(
  "/create-join-token/:teamId",
  authenticateToken,
  async (req, res) => {
    console.log("- accessed GET /contract-team-user/create-join-token/:teamId");
    const teamId = req.params.teamId;
    // const joinToken = tokenizeObject({ teamId });
    const joinToken = jwt.sign({ teamId }, process.env.JWT_SECRET, {
      expiresIn: "2m",
    });
    const shareUrl = `${process.env.URL_BASE_KV_API}/contract-team-user/join/${joinToken}`;
    res.status(200).json({ shareUrl });
  }
);

// GET /contract-team-user/join/:joinToken
router.get("/join/:joinToken", authenticateToken, async (req, res) => {
  console.log("- accessed GET /contract-team-user/join/:joinToken");
  const joinToken = req.params.joinToken;
  jwt.verify(joinToken, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    const { teamId } = decoded;
    const contractTeamUserExists = await ContractTeamUser.findOne({
      where: { teamId, userId: req.user.id },
    });
    if (contractTeamUserExists) {
      return res.status(400).json({ message: "User already in team" });
    }
    // check if contractTeamUser already exists and if not create it
    const contractTeamUser = await ContractTeamUser.create({
      teamId,
      userId: req.user.id,
    });

    res.json({ result: true, contractTeamUser });
  });
});

// POST /contract-team-user/toggle-role
router.post("/toggle-role", authenticateToken, async (req, res) => {
  console.log("- accessed POST /contract-team-user/toggle-role");
  try {
    const { teamId, role, userId } = req.body;
    console.log(`userId: ${userId}`);
    console.log(`teamId: ${teamId}`);
    console.log(`role: ${role}`);
    const contractTeamUser = await ContractTeamUser.findOne({
      where: { teamId, userId },
    });
    if (!contractTeamUser) {
      return res.status(404).json({ message: "ContractTeamUser not found" });
    }
    // await contractTeamUser.update({ role });
    if (role === "Coach") {
      await contractTeamUser.update({ isCoach: !contractTeamUser.isCoach });
    }
    if (role === "Admin") {
      await contractTeamUser.update({ isAdmin: !contractTeamUser.isAdmin });
    }
    if (role === "Member") {
      await contractTeamUser.update({
        isSuperUser: false,
        isAdmin: false,
        isCoach: false,
      });
    }
    res.json({ result: true, contractTeamUser });
  } catch (error) {
    res.status(500).json({
      error: "Error modifying contractTeamUser role",
      details: error.message,
    });
  }
});

module.exports = router;
