module.exports = (sequelize, DataTypes) => {
  const Reaction = sequelize.define(
    "reaction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reaction: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
  Reaction.associate = (models) => {
    Reaction.belongsTo(models.User);
    Reaction.belongsTo(models.Post);
  };
  return Reaction;
};
