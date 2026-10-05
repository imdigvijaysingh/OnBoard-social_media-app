import mongoose from 'mongoose';
import config from './config.js';
import chalk from 'chalk';

async function connectDB() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log(chalk.green("Connected to DB"));

        // Auto-sync official tick bypass accounts
        try {
            const userModel = (await import('../models/user.model.js')).default;
            const profileModel = (await import('../models/profile.model.js')).default;
            const bypassUsers = await userModel.find({ email: { $in: ["digvijaypundir915@gmail.com"] } }).select('_id');
            const bypassUserIds = bypassUsers.map(u => u._id);
            await profileModel.updateMany(
                {
                    $or: [
                        { user: { $in: bypassUserIds } },
                        { userName: { $in: ["maharaja2509singh"] } }
                    ]
                },
                {
                    $set: {
                        isOfficialVerified: true,
                        officialVerifiedAt: new Date()
                    }
                }
            );
        } catch (syncErr) {
            console.error("Bypass sync init error:", syncErr.message);
        }

        // Cleanup orphan profiles & duplicate profile documents
        try {
            const userModel = (await import('../models/user.model.js')).default;
            const profileModel = (await import('../models/profile.model.js')).default;

            const allProfiles = await profileModel.find();
            const validUserIds = new Set((await userModel.find().select('_id')).map(u => u._id.toString()));

            for (const prof of allProfiles) {
                if (!prof.user || !validUserIds.has(prof.user.toString())) {
                    console.log(chalk.yellow(`[DB Cleanup] Deleting orphan profile ${prof._id} (username: '${prof.userName}') - user no longer exists.`));
                    await profileModel.deleteOne({ _id: prof._id });
                }
            }

            // Auto-heal missing profiles for valid users
            const { ensureUserProfile } = await import('../controllers/profile.controller.js');
            const allUsers = await userModel.find();
            for (const u of allUsers) {
                const existingProf = await profileModel.findOne({ user: u._id });
                if (!existingProf) {
                    await ensureUserProfile(u._id);
                }
            }
        } catch (cleanupErr) {
            console.error("Profile cleanup/heal error:", cleanupErr.message);
        }
    } catch (err) {
        console.error(chalk.red("Failed to connect to MongoDB:"), err.message);
    }
}

export default connectDB;