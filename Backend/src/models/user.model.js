import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: {
      type: String,
      required: [ true, "FirstName is required" ]
    }, 
    lastName: {
      type: String
    }, 
    email: {
      type: String,
      required: [ true, "Email is required" ],
      unique: [ true, "A user is already registered with the same email" ]  
    }, 
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      default: null,
    },
    googlePicture: {
      type: String,
      default: null,
    },
    cloudBackupEnabled: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
}, {
    timestamps: true
});

const userModel = mongoose.model("users", userSchema);

export default userModel;