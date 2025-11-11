// server/server.ts
import express4 from "express";
import * as Path2 from "node:path";
import * as URL2 from "node:url";

// server/routes/suggestions.ts
import express from "express";

// server/db/knexfile.js
import * as Path from "node:path";
import * as URL from "node:url";
var __filename = URL.fileURLToPath(import.meta.url);
var __dirname = Path.dirname(__filename);
var knexfile_default = {
  development: {
    client: "sqlite3",
    useNullAsDefault: true,
    connection: {
      filename: Path.join(__dirname, "dev.sqlite3")
    },
    pool: {
      afterCreate: (conn, cb) => conn.run("PRAGMA foreign_keys = ON", cb)
    }
  },
  test: {
    client: "sqlite3",
    useNullAsDefault: true,
    connection: {
      filename: ":memory:"
    },
    migrations: {
      directory: Path.join(__dirname, "migrations")
    },
    seeds: {
      directory: Path.join(__dirname, "seeds")
    },
    pool: {
      afterCreate: (conn, cb) => conn.run("PRAGMA foreign_keys = ON", cb)
    }
  },
  production: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }
};

// server/db/connection.ts
import knex from "knex";
var environment = process.env.NODE_ENV || "development";
var config = knexfile_default[environment];
var connection = knex(config);
var connection_default = connection;

// server/db/suggestions.ts
async function getSuggestions(city, db = connection_default) {
  return await db("suggestions").where("city_name", city).select();
}

// server/logger.ts
function logError(message) {
  console.error(message);
}

// server/routes/suggestions.ts
var router = express.Router();
router.get("/search", async (req, res) => {
  const targetCity = req.query.city;
  if (!targetCity) {
    res.status(400).json({ message: "Please provide a city" });
    return;
  }
  try {
    const data = await getSuggestions(targetCity);
    res.status(200).json(data);
  } catch (error) {
    logError(error);
    res.status(500).json({ message: "Unable to retrieve suggestions" });
  }
});
var suggestions_default = router;

// server/routes/travel_details.ts
import express2 from "express";

// server/db/travel_details.ts
async function addTravelDetail(newTravelDetail, db = connection_default) {
  return await db("travel_details").insert(newTravelDetail);
}
async function getTravelDetails(userId, db = connection_default) {
  return await db("travel_details").where("user_id", userId).select();
}
async function getTravelDetailAndSuggestions(travelDetailId, db = connection_default) {
  const travelDetail = await db("travel_details").where("id", travelDetailId).select().first();
  const suggestions = await db("suggestions").select().whereExists(function() {
    this.select("id").from("itinerary").whereRaw("itinerary.suggestion_id = suggestions.id").andWhere("itinerary.detail_id", travelDetailId);
  });
  const response = {
    travelDetail,
    suggestions
  };
  return response;
}

// server/auth0.ts
import { auth } from "express-oauth2-jwt-bearer";
import * as jose from "jose";
import dotenv from "dotenv";
dotenv.config();
var DEFAULT_AUTH0_DOMAIN = "pohutukawa-2023-ricky.au.auth0.com";
var DEFAULT_AUTH0_AUDIENCE = "https://travels/api";
var DEFAULT_AUTH0_CLIENT_ID = "Ouo4yhNha6QVHJd1XeV3rKaLe0dmGsvM";
var AUTH0_DOMAIN = process.env.VITE_AUTH0_DOMAIN || DEFAULT_AUTH0_DOMAIN;
var AUTH0_AUDIENCE = process.env.VITE_AUTH0_AUDIENCE || DEFAULT_AUTH0_AUDIENCE;
var AUTH0_CLIENT_ID = process.env.VITE_AUTH0_CLIENT_ID || DEFAULT_AUTH0_CLIENT_ID;
var AUTH0_CLIENT_SECRET = process.env.VITE_AUTH0_CLIENT_SECRET;
var oidcConfig = {
  authorizationParams: {
    response_type: "code",
    scope: "openid profile email create:orders update:users",
    audience: AUTH0_AUDIENCE
  },
  authRequired: false,
  auth0Logout: true,
  baseURL: "http://localhost:3000",
  clientID: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  secret: "LONG_RANDOM_STRING",
  routes: {
    login: false,
    postLogoutRedirect: "/moderator/home"
  }
};
var authConfig = {
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  audience: AUTH0_AUDIENCE
};
var validateAccessToken = auth(authConfig);

// server/routes/travel_details.ts
var router2 = express2.Router();
router2.post("/", validateAccessToken, async (req, res) => {
  const auth0Id = req.auth?.payload.sub;
  const { start_date, end_date, city } = req.body;
  if (!auth0Id) {
    res.status(400).json({ message: "Please provide an id" });
    return;
  }
  if (!start_date) {
    res.status(400).json({ message: "Please provide a newStartDate" });
    return;
  }
  if (!city) {
    res.status(400).json({ message: "Please provide a newCity" });
    return;
  }
  const newTravelDetail = {
    user_id: auth0Id,
    start_date,
    end_date,
    city
    // date: newStartDate + '~' + newEndDate,
  };
  try {
    const response = await addTravelDetail(newTravelDetail);
    res.status(201).json(response);
  } catch (error) {
    logError(error);
    res.status(500).json({ message: "Something wrong" });
  }
});
router2.get("/", validateAccessToken, async (req, res) => {
  const auth0Id = req.auth?.payload.sub;
  if (!auth0Id) {
    res.status(400).json({ message: "Please provide an id" });
    return;
  }
  try {
    const data = await getTravelDetails(auth0Id);
    res.status(200).json(data);
  } catch (error) {
    logError(error);
    res.status(500).json({ message: "Something wrong" });
  }
});
router2.get("/:detailId", validateAccessToken, async (req, res) => {
  const detailId = Number(req.params.detailId);
  try {
    const data = await getTravelDetailAndSuggestions(detailId);
    res.status(200).json(data);
  } catch (error) {
    logError(error);
    res.status(500).json({ message: "Something wrong" });
  }
});
var travel_details_default = router2;

// server/routes/itinerary.ts
import express3 from "express";

// server/db/itinerary.ts
async function addItinerary(newItinerary, db = connection_default) {
  return await db("itinerary").insert(newItinerary);
}

// server/routes/itinerary.ts
var router3 = express3.Router();
router3.post("/", validateAccessToken, async (req, res) => {
  const { detailId, suggestionId } = req.body;
  if (!detailId) {
    res.status(400).json({ message: "Please provide a detailId" });
    return;
  }
  if (!suggestionId) {
    res.status(400).json({ message: "Please provide a suggestionId" });
    return;
  }
  const newItinerary = {
    detail_id: detailId,
    suggestion_id: suggestionId
  };
  try {
    await addItinerary(newItinerary);
    res.sendStatus(201);
  } catch (error) {
    logError(error);
    res.status(500).json({ message: "Something wrong" });
  }
});
var itinerary_default = router3;

// server/server.ts
var __filename2 = URL2.fileURLToPath(import.meta.url);
var __dirname2 = Path2.dirname(__filename2);
var server = express4();
server.use(express4.json());
server.use(express4.static(Path2.join(__dirname2, "public")));
server.use("/api/v1/suggestions", suggestions_default);
server.use("/api/v1/travelDetail", travel_details_default);
server.use("/api/v1/itinerary", itinerary_default);
server.get("*", (req, res) => {
  res.sendFile(Path2.join(__dirname2, "public/index.html"));
});
var server_default = server;

// server/index.ts
var port = 3e3;
server_default.listen(port, () => {
  console.log("Server listening on port", port);
});
