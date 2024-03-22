const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    otp: { 
        type: String, 
        required: true,
    },
    isVerified: { 
        type: Boolean,
        required: true, 
        default: false 
    },
    // bio: {
    //     type: String,
    // },
    // profile_image: {
    //     url: {
    //         type: String,
    //         default: "https://res.cloudinary.com/dfq5rnahw/image/upload/v1707322333/invito/default-profile-photo_blxuie.avif"
    //     },
    //     filename: String
    // }
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;