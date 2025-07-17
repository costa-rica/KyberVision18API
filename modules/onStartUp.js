const { User, Team, Session, League } = require("kybervision17db");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { createNewTeam } = require("./teams");
const { addUserToFreeAgentTeam } = require("./users");
const { createSessionWithFreeAgentLeague } = require("./sessions");

function verifyCheckDirectoryExists() {
  // add directory paths to check (and create if they don't exist)
  const pathsToCheck = [
    process.env.PATH_DATABASE,
    process.env.PATH_PROJECT_RESOURCES,
    process.env.PATH_VIDEOS,
    process.env.PATH_VIDEOS_UPLOADED,
    process.env.PATH_DB_BACKUPS,
  ];

  pathsToCheck.forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  });
}

async function onStartUpCreateFreeAgentLeagueAndTeam() {
  try {
    const existingFreeAgentTeam = await Team.findOne({
      where: { teamName: "Free Agent Team" },
    });

    if (existingFreeAgentTeam) {
      console.log("ℹ️  Free Agent team already initialized. Skipping setup.");
      return;
    }

    await League.create({
      name: "Free Agent League",
      category: "Free Agents",
    });

    await createNewTeam(
      "Free Agent Team",
      "Free Agent City",
      "Free Agent Coach"
    );
    console.log("✅ Free Agent league, team created.");
  } catch (err) {
    console.error("❌ Error during dummy data setup:", err);
  }
}

async function onStartUpCreateEnvUsers() {
  if (!process.env.ADMIN_EMAIL_KV_MANAGER_WEBSITE) {
    console.warn("⚠️ No admin emails found in env variables.");
    return;
  }

  let adminEmails;
  try {
    adminEmails = JSON.parse(process.env.ADMIN_EMAIL_KV_MANAGER_WEBSITE);
    if (!Array.isArray(adminEmails)) throw new Error();
  } catch (error) {
    console.error(
      "❌ Error parsing ADMIN_EMAIL_KV_MANAGER_WEBSITE. Ensure it's a valid JSON array."
    );
    return;
  }

  for (const email of adminEmails) {
    try {
      const existingUser = await User.findOne({ where: { email } });

      if (!existingUser) {
        console.log(`🔹 Creating admin user: ${email}`);

        const hashedPassword = await bcrypt.hash("test", 10); // Default password, should be changed later.

        const newUser = await User.create({
          username: email.split("@")[0],
          email,
          password: hashedPassword,
          isAdminForKvManagerWebsite: true, // Set admin flag
        });

        await addUserToFreeAgentTeam(newUser.id);

        console.log(`✅ Admin user created: ${email}`);
      } else {
        console.log(`ℹ️  User already exists: ${email}`);
      }
    } catch (err) {
      console.error(`❌ Error creating admin user (${email}):`, err);
    }
  }
}

// async function onStartUpCreatePracticeMatchForEachTeam() {
async function onStartUpCreatePracticeSessionForEachTeam() {
  let practiceLeague = await League.findOne({
    where: { name: "Free Agent League" },
  });

  if (!practiceLeague) {
    practiceLeague = await League.create({
      name: "Free Agent League",
      category: "Free Agents",
    });
  }

  let practiceSessionCount = 0;
  try {
    const allTeams = await Team.findAll();

    for (const currentTeam of allTeams) {
      const existingPracticeSession = await Session.findOne({
        where: {
          teamId: currentTeam.id,
          city: "Practice",
        },
      });

      if (!existingPracticeSession) {
        await createSessionWithFreeAgentLeague(currentTeam.id);
        // await Match.create({
        //   teamIdAnalyzed: currentTeam.id,
        //   teamIdOpponent: currentTeam.id,
        //   matchDate: new Date().toISOString().split("T")[0],
        //   leagueId: practiceLeague.id,
        //   teamIdWinner: null,
        //   competitionContractId: null,
        //   city: "practice",
        // });
        console.log(
          `✅ Practice session created for team: ${currentTeam.teamName}`
        );
        practiceSessionCount++;
      }
    }
    if (practiceSessionCount === 0) {
      console.log(`ℹ️  All teams have practice sessions.`);
    }
  } catch (err) {
    console.error("❌ Error creating practice sessions:", err);
  }
}

module.exports = {
  verifyCheckDirectoryExists,
  onStartUpCreateEnvUsers,
  onStartUpCreateFreeAgentLeagueAndTeam,
  onStartUpCreatePracticeSessionForEachTeam,
};
