module.exports = (sequelize, DataTypes) => {
  const Participant = sequelize.define("participant", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  });
  Participant.associate = (models) => {
    Participant.belongsTo(models.User);
    Participant.belongsTo(models.Conversation);
  };
  return Participant;
};
