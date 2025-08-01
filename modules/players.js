const { Player, ContractTeamPlayer } = require("kybervision17db");
async function createUniquePlayerObjArray(actions) {
  try {
    // 🔹 Extract unique player IDs
    const uniquePlayerIds = [
      ...new Set(actions.map((action) => action.playerId)),
    ];

    if (uniquePlayerIds.length === 0) {
      return []; // Return empty array if no players are found
    }

    // 🔹 Query the Player table for their full objects
    const players = await Player.findAll({
      where: { id: uniquePlayerIds },
      attributes: ["id", "firstName", "lastName", "birthDate"], // Adjust attributes as needed
    });

    return players; // Return full player objects
  } catch (error) {
    console.error("Error fetching unique player objects:", error);
    throw new Error("Failed to fetch unique player objects.");
  }
}

async function createUniquePlayerNamesArray(actions) {
  try {
    // 🔹 Extract unique player IDs
    const uniquePlayerIds = [
      ...new Set(actions.map((action) => action.playerId)),
    ];

    if (uniquePlayerIds.length === 0) {
      return []; // Return empty array if no players are found
    }

    // 🔹 Query the Player table for their first names
    const players = await Player.findAll({
      where: { id: uniquePlayerIds },
      attributes: ["firstName"], // Only retrieve the firstName column
    });

    // 🔹 Extract first names and ensure uniqueness
    const uniquePlayerNames = [
      ...new Set(players.map((player) => player.firstName)),
    ];

    return uniquePlayerNames;
  } catch (error) {
    console.error("Error fetching unique player names:", error);
    throw new Error("Failed to fetch unique player names.");
  }
}

async function addNewPlayerToTeam(
  teamId,
  firstName,
  lastName = null,
  shirtNumber = null,
  position = null,
  positionAbbreviation = null
) {
  try {
    // const player = await Player.create({
    //   teamId,
    //   playerId,
    // });

    const playerNew = await Player.create({
      teamId,
      firstName,
      lastName,
      // birthDate: player.birthDate,
    });
    await ContractTeamPlayer.create({
      teamId,
      playerId: playerNew.id,
      shirtNumber,
      position,
      positionAbbreviation,
    });
    return playerNew;
  } catch (error) {
    console.error("Error adding player to team:", error);
    throw new Error("Failed to add player to team.");
  }
}

module.exports = {
  createUniquePlayerNamesArray,
  createUniquePlayerObjArray,
  addNewPlayerToTeam,
};
