"use strict";

const { SalonType } = require("../models/salon/salon-types");

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV !== "development") {
            console.log("Skipping seeder file for production ======>>>");
            return;
        }

        // ✅ ESM imports
        const { faker } = await import("@faker-js/faker");
        const { v4: uuidv4 } = await import("uuid");
        const bcrypt = require("bcrypt");

        // Base location (New Delhi)
        const BASE_LAT = 28.6139;
        const BASE_LON = 77.2090;

        function randomLocationWithinRadius(lat, lon, radiusKm) {
            const radiusInDegrees = radiusKm / 111;

            const u = Math.random();
            const v = Math.random();

            const w = radiusInDegrees * Math.sqrt(u);
            const t = 2 * Math.PI * v;

            const deltaLat = w * Math.cos(t);
            const deltaLon =
                (w * Math.sin(t)) / Math.cos(lat * Math.PI / 180);

            return {
                latitude: lat + deltaLat,
                longitude: lon + deltaLon,
            };
        }

        const passwordHash = await bcrypt.hash("Password@123", 10);

        const salons = [];

        const distanceBuckets = [
            { radius: 1, count: 10 },
            { radius: 3, count: 15 },
            { radius: 5, count: 20 },
            { radius: 10, count: 25 },
            { radius: 20, count: 30 },
        ];

        let index = 1;

        for (const bucket of distanceBuckets) {
            for (let i = 0; i < bucket.count; i++) {
                const { latitude, longitude } =
                    randomLocationWithinRadius(
                        BASE_LAT,
                        BASE_LON,
                        bucket.radius
                    );

                salons.push({
                    uuid: uuidv4(),
                    name: `Salon ${index} (${bucket.radius}km zone)`,
                    phone: faker.phone.number("9#########"),
                    email: `salon${index}@example.com`,
                    password: passwordHash,
                    address: faker.location.streetAddress(),
                    latitude,
                    longitude,
                    owner_name: faker.person.fullName(),
                    type:  "male",
                    map_link: faker.internet.url(),
                    about: faker.lorem.sentences(2),
                    is_onboarded: true,
                    logo: faker.image.url(),
                    photos: JSON.stringify([
                        faker.image.url(),
                        faker.image.url(),
                    ]),
                    business_hours: JSON.stringify({
                        mon: "09:00-20:00",
                        tue: "09:00-20:00",
                        wed: "09:00-20:00",
                        thu: "09:00-20:00",
                        fri: "09:00-20:00",
                        sat: "10:00-18:00",
                        sun: "closed",
                    }),
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                index++;
            }
        }

        await queryInterface.bulkInsert("salons", salons, {});
        console.log(`✅ Inserted ${salons.length} salons`);
    },

    async down(queryInterface, Sequelize) {
        if (process.env.NODE_ENV !== "development") {
            return;
        }

        await queryInterface.bulkDelete("salons", null, {});
    },
};
