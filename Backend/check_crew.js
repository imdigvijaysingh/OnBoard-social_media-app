import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const profiles = await mongoose.connection.collection("profiles").find({}).toArray();
  console.log("Total profiles:", profiles.length);
  for (const p of profiles) {
    console.log(`User: ${p.user}, userName: ${p.userName}, boards:`, p.boards);
  }
  const users = await mongoose.connection.collection("users").find({}).toArray();
  console.log("Total users:", users.length);
  for (const u of users) {
    console.log(`ID: ${u._id}, email: ${u.email}, name: ${u.firstName} ${u.lastName}`);
  }
  process.exit(0);
}

run();
