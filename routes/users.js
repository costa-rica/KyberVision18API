const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {
  User,
  ContractTeamUser,
  PendingInvitations,
} = require("kybervision18db");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail } = require("../modules/mailer");
const os = require("os");

// POST /users/register
router.post("/register", async (req, res) => {
  const { firstName, lastName, password, email } = req.body;

  if (!password || !email) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  const username = email.split("@")[0];

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: "L'utilisateur existe déjà." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    password: hashedPassword,
    email,
    username,
    created: new Date(),
  });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  // const token = jwt.sign({ user }, process.env.JWT_SECRET, {
  //   expiresIn: "5h",
  // });

  const areWeOnMacMiniWorkstation = os.hostname();
  console.log(`areWeOnMacMiniWorkstation: ${areWeOnMacMiniWorkstation}`);
  if (
    areWeOnMacMiniWorkstation !== "Nicks-Mac-mini.local" &&
    areWeOnMacMiniWorkstation !== "Nicks-MacBook-Air.local"
  ) {
    await sendRegistrationEmail(email, username)
      .then(() => console.log("Email sent successfully"))
      .catch((error) => console.error("Email failed:", error));
  } else {
    console.log("Email not sent");
  }

  // check if pending invitation exists
  const pendingInvitationArray = await PendingInvitations.findAll({
    where: { email },
  });
  if (pendingInvitationArray.length > 0) {
    // create contract team user for each teamId in pendingInvitationArray
    await Promise.all(
      pendingInvitationArray.map(async (pendingInvitation) => {
        await ContractTeamUser.create({
          teamId: pendingInvitation.teamId,
          userId: user.id,
        });
        // delete pending invitation
        await pendingInvitation.destroy();
      })
    );
  }

  res.status(201).json({ message: "Successfully created user", user, token });
});

// POST /users/login
router.post("/login", async (req, res) => {
  var { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  const user = await User.findOne({
    where: { email },
    include: [ContractTeamUser],
  });
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Mot de passe incorrect." });
  }

  await user.update({ updatedAt: new Date() });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  // const token = jwt.sign({ user }, process.env.JWT_SECRET, {
  //   expiresIn: "5h",
  // });

  var { password, ...userWithoutPassword } = user.toJSON();

  res
    .status(200)
    .json({ message: "Connexion réussie.", token, user: userWithoutPassword });
});

module.exports = router;
