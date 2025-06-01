const express = require("express");
const { authenticateToken } = require("../modules/userAuthentication");
const router = express.Router();
const { Video, ContractTeamUser } = require("kybervision16db");
const { getSessionWithTeams } = require("../modules/sessions");

// Video file nameing convention
// ${process.env.PREFIX_VIDEO_FILE_NAME}_videoId${video.id}_sessionId${video.sessionId}.mp4

// 🔹 GET /videos/team/:teamId - Get All Team Videos with Match Data
router.get("/team/:teamId", authenticateToken, async (req, res) => {
  console.log(`- in GET /api/videos/team/:teamId`);
  try {
    const { teamId } = req.params;
    console.log(`teamId: ${teamId}`);
    // Fetch videos whose groupContract is associated with the given teamId
    const videosArray = await Video.findAll({
      include: [
        {
          model: ContractTeamUser,
          // where: { teamId: parseInt(teamId, 10) },
          where: { teamId: teamId },
          attributes: ["id", "teamId", "userId"], // optional: include related info
        },
      ],
    });
    // console.log(videosArray);

    // Process videos to include match & team details
    const formattedVideos = await Promise.all(
      videosArray.map(async (video) => {
        const sessionData = await getSessionWithTeams(video.sessionId);
        return {
          ...video.get(), // Extract raw video data
          session: sessionData.success ? sessionData.session : null, // Include session data if successful
        };
      })
    );

    // console.log(formattedVideos);

    res.json({ result: true, videosArray: formattedVideos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      result: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// // 🔹 GET /videos/ - Get All Videos with Match Data
// router.get("/", authenticateToken, async (req, res) => {
//   console.log(`- in GET /api/videos`);
//   try {
//     // Fetch all videos with associated match data
//     const videos = await Video.findAll();

//     // Process videos to include match & team details
//     const formattedVideos = await Promise.all(
//       videos.map(async (video) => {
//         const sessionData = await getSessionWithTeams(video.sessionId);
//         return {
//           ...video.get(), // Extract raw video data
//           session: sessionData.success ? sessionData.session : null, // Include session data if successful
//         };
//       })
//     );

//     res.json({ result: true, videosArray: formattedVideos });
//   } catch (error) {
//     console.error("Error fetching videos:", error);
//     res.status(500).json({
//       result: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// });

module.exports = router;
