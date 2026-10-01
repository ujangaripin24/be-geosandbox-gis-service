'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TblGeometryProject extends Model {
    static associate(models) {
      TblGeometryProject.belongsTo(models.TblProjectGeo, {
        foreignKey: 'uuid_project_geo',
        targetKey: 'uuid',
        as: 'project'
      });
      TblGeometryProject.belongsTo(models.DetailUsers, {
        foreignKey: 'uuid_user',
        targetKey: 'uuid',
        as: 'user'
      });
    }
  }

  TblGeometryProject.init({
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uuid_project_geo: {
      type: DataTypes.UUID,
      allowNull: false
    },
    uuid_user: {
      type: DataTypes.UUID,
      allowNull: false
    },
    geom: {
      type: DataTypes.GEOMETRY('GEOMETRY', 4326),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TblGeometryProject',
    tableName: 'tbl_geometry_project',
    timestamps: true
  });

  return TblGeometryProject;
};
