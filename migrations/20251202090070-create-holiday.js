'use strict';

const { HolidayType } = require("../models/holiday/holiday-types");

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_holiday_type" AS ENUM (
                '${HolidayType.ENUM.SALON}',
                '${HolidayType.ENUM.STAFF}'
            );
        `);

        await queryInterface.createTable('holidays', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            uuid: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                unique: true,
                allowNull: false,
            },
            holiday_type: {
                type: 'enum_holiday_type',
                allowNull: false,
            },
            parent_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            holiday_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        })

    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('holidays');
        
        await queryInterface.sequelize.query(`
            DROP TYPE "enum_holiday_type";
        `);

    }
};
