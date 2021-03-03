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
      socketId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        // unique: true,
      },

      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "offline",
      },
      refresh_tokens: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      imgUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      about: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.name} ${this.surname}`;
        },
        set(value) {
          throw new Error("Do not try to set the `fullName` value!");
        },
      },
      address: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.city}, ${this.country}`;
        },
        set(value) {
          throw new Error("Do not try to set the `fullName` value!");
        },
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
        beforeBulkUpdate: async function (user) {
          if (user.attributes.password) {
            const salt = await bcrypt.genSalt(12);
            user.attributes.password = await bcrypt.hash(
              user.attributes.password,
              salt
            );
          }
        },
      },
    }
  );
  User.associate = (models) => {
    User.hasMany(models.Education);
    User.hasMany(models.Experience);
    User.hasMany(models.Post);
    User.hasMany(models.Reaction);
    User.hasMany(models.Comment);
    User.hasMany(models.Conversation, { foreignKey: "userId" });
    User.hasMany(models.Participant);
    User.belongsToMany(models.Conversation, {
      through: models.Participant,
      as: "parts",
    });
    User.hasMany(models.Message);
  };
  return User;
};
