require("dotenv").config();
const { sequelize } = require("kybervision17db");
const { verifyCheckDirectoryExists } = require("./modules/onStartUp");
verifyCheckDirectoryExists();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var adminDbRouter = require("./routes/adminDb");
var contractTeamUserRouter = require("./routes/contractTeamUser");
var videosRouter = require("./routes/videos");
var sessionsRouter = require("./routes/sessions");
var leaguesRouter = require("./routes/leagues");
var playersRouter = require("./routes/players");
var scriptsRouter = require("./routes/scripts");
var teamsRouter = require("./routes/teams");
var contractVideoActionsRouter = require("./routes/contractVideoActions");
var contractPlayerUserRouter = require("./routes/contractPlayerUser");

var app = express();
const cors = require("cors");
// cors options send content-type application/json
app.use(
  cors({
    credentials: true,
    exposedHeaders: ["Content-Disposition"], // <-- this line is key
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/admin-db", adminDbRouter);
app.use("/contract-team-user", contractTeamUserRouter);
app.use("/videos", videosRouter);
app.use("/sessions", sessionsRouter);
app.use("/leagues", leaguesRouter);
app.use("/players", playersRouter);
app.use("/scripts", scriptsRouter);
app.use("/teams", teamsRouter);
app.use("/contract-video-actions", contractVideoActionsRouter);
app.use("/contract-player-user", contractPlayerUserRouter);

// Increase payload size for large files
app.use(express.json({ limit: "6gb" }));
app.use(express.urlencoded({ limit: "6gb", extended: true }));

const {
  onStartUpCreateEnvUsers,
  // onStartUpCreateFreeAgentLeagueAndTeam,
  // onStartUpCreatePracticeSessionForEachTeam,
  onStartUpCreateLeague,
} = require("./modules/onStartUp");

// Sync database and then create environment users
sequelize
  .sync()
  .then(async () => {
    console.log("✅ Database connected & synced");
    // await onStartUpCreateFreeAgentLeagueAndTeam();
    await onStartUpCreateEnvUsers(); // <-- Call function here
    // await onStartUpCreatePracticeSessionForEachTeam();
    await onStartUpCreateLeague();
  })
  .catch((error) => console.error("❌ Error syncing database:", error));

module.exports = app;
