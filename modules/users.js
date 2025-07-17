const { Team, ContractTeamUser } = require("kybervision17db");

async function addUserToFreeAgentTeam(userId) {
  try {
    const freeAgentTeam = await Team.findOne({
      where: { teamName: "Free Agent Team" },
    });

    if (!freeAgentTeam) {
      console.log("ℹ️  Free Agent team not found. Skipping setup.");
      return;
    }

    const contractTeamUser = await ContractTeamUser.create({
      userId,
      teamId: freeAgentTeam.id,
    });

    console.log(`✅ User ${userId} added to Free Agent team.`);
  } catch (err) {
    console.error(`❌ Error adding user ${userId} to Free Agent team:`, err);
  }
}

module.exports = {
  addUserToFreeAgentTeam,
};
