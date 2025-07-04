const express = require("express");
const { authenticateToken } = require("../modules/userAuthentication");
const router = express.Router();
const { Video, ContractTeamUser } = require("kybervision16db");
const { getSessionWithTeams } = require("../modules/sessions");
const {
  upload,
  requestJobQueuerVideoUploaderYouTubeProcessing,
  renameVideoFile,
  deleteVideo,
  deleteVideoFromYouTube,
} = require("../modules/videos");
const path = require("path");
const fs = require("fs");
const { updateContractScriptVideosWithVideoId } = require("../modules/scripts");
// Video file nameing convention
// ${process.env.PREFIX_VIDEO_FILE_NAME}_videoId${video.id}_sessionId${video.sessionId}.mp4

// 🔹 GET /videos/ - Get All Videos with Match Data
router.get("/", authenticateToken, async (req, res) => {
  console.log(`- in GET /api/videos`);
  const user = req.user;
  try {
    // Fetch all videos with associated match data
    const videos = await Video.findAll();

    // Process videos to include match & team details
    const formattedVideos = await Promise.all(
      videos.map(async (video) => {
        const sessionData = await getSessionWithTeams(video.sessionId);
        return {
          ...video.get(), // Extract raw video data
          session: sessionData.success ? sessionData.session : null, // Include match data if successful
        };
      })
    );
    // console.log("--- formattedVideos ------");
    // console.log(formattedVideos);
    // console.log(" -----------------------------");

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

// 🔹 POST /videos/upload-youtube
router.post(
  "/upload-youtube",
  authenticateToken,
  upload.single("video"),
  async (req, res) => {
    console.log("- in POST /videos/upload-youtube");

    // Set timeout for this specific request to 2400 seconds (40 minutes)
    req.setTimeout(2400 * 1000);

    const { sessionId } = req.body;
    const user = req.user;
    console.log(`user: ${JSON.stringify(user)}`);

    // Validate required fields
    if (!sessionId) {
      return res
        .status(400)
        .json({ result: false, message: "sessionId is required" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ result: false, message: "No video file uploaded" });
    }

    // Step 1: Get video file size in MB
    const fileSizeBytes = req.file.size;
    const fileSizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(2);

    console.log(`📁 Video File Size: ${fileSizeMb} MB`);

    // Step 2: Create video entry with placeholder URL & file size
    const newVideo = await Video.create({
      sessionId: parseInt(sessionId, 10),
      filename: req.file.filename,
      url: "placeholder",
      videoFileSizeInMb: fileSizeMb,
      pathToVideoFile: process.env.PATH_VIDEOS_UPLOADED,
      // processingStatus: "pending",
      originalVideoFilename: req.file.originalname,
    });
    // console.log("---- user ---");
    // console.log(user);

    // Step 2.1: Rename the uploaded file
    const renamedFilename = renameVideoFile(newVideo.id, sessionId, user.id);
    const renamedFilePath = path.join(
      process.env.PATH_VIDEOS_UPLOADED,
      renamedFilename
    );

    // Step 2.2:Rename the file
    fs.renameSync(
      path.join(process.env.PATH_VIDEOS_UPLOADED, req.file.filename),
      renamedFilePath
    );
    await newVideo.update({
      filename: renamedFilename,
    });

    // Step 3: Generate and update video URL
    const videoURL = `https://${req.get("host")}/videos/${newVideo.id}`;
    await newVideo.update({ url: videoURL });

    // Step 5: Loop through all scripts and update ContractScriptVideos
    // let syncContractUpdates = await updateSyncContractsWithVideoId(
    let contractScriptVideoUpdates =
      await updateContractScriptVideosWithVideoId(newVideo.id, sessionId);

    const videoId = newVideo.id;
    // Step 6: spawn KyberVision14YouTuber child process
    await requestJobQueuerVideoUploaderYouTubeProcessing(
      renamedFilename,
      videoId
    );
    return res.json({ result: true });
  }
);

// 🔹 DELETE /videos/:videoId
router.delete("/:videoId", authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;

    const {
      success: successYouTube,
      message: messageYouTube,
      error: errorYouTube,
    } = await deleteVideoFromYouTube(videoId);
    console.log(
      `YouTube delete response: ${JSON.stringify({
        successYouTube,
        messageYouTube,
        errorYouTube,
      })}`
    );
    if (!successYouTube) {
      return res.status(404).json({ errorYouTube });
    } else {
      console.log("YouTube video deleted successfully");
      console.log("---> Deleting video from server and Db");
    }

    const { success, message, error } = await deleteVideo(videoId);

    if (!success) {
      return res.status(404).json({ error });
    }

    res.status(200).json({ message });
  } catch (error) {
    console.error("Error in DELETE /videos/:videoId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
