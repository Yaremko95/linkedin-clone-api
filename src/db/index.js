const { Sequelize, DataTypes } = require("sequelize");
const User = require('./users')
const Education = require('./educations')
const Experience = require('./experiences')
const Post = require('./posts')
const Reaction = require('./reactions')
const Comment = require('./comments')
const bcrypt = require("bcrypt");
const sequelize = new Sequelize(
    process.env.PGDATABASE,
    process.env.PGUSER,
    process.env.PGPASSWORD,
    {
        host: process.env.PGHOST,
        dialect: "postgres",
        // dialectOptions: {
        //   ssl: true,
        // },

    }
);
const db = {
    User:User(sequelize, DataTypes),
    Education:Education(sequelize, DataTypes),
    Experience:Experience(sequelize, DataTypes),
    Post:Post(sequelize, DataTypes),
    Reaction:Reaction(sequelize, DataTypes),
    Comment:Comment(sequelize, DataTypes)
};
Object.keys(db).forEach((modelName) => {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db