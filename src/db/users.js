const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        "user",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            surname: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            email: {
                type: DataTypes.STRING,
                allowNull: true,
                // unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            refresh_tokens: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
            },

        },
        {
            timestamps: false,
            hooks: {
                beforeCreate: async function (user) {
                    if (user.password) {
                        const salt = await bcrypt.genSalt(12);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                },
                beforeUpdate: async function (user) {
                    if (user.password) {
                        const salt = await bcrypt.genSalt(12);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                },
            },
        }
    );
    User.associate = (models) => {
        User.hasMany(models.Education );
        User.hasMany(models.Experience);
        User.hasMany(models.Post);
        User.hasMany(models.Reaction);
        User.hasMany(models.Comment);
    };
    return User;
};
