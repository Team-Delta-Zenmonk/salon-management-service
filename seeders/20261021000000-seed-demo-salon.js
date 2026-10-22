"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const salonSlug = "glow";
    const salonEmail = "glow.salon@example.com";

    const existingSalon = await queryInterface.rawSelect(
      "salons",
      {
        where: { slug: salonSlug },
      },
      ["id"]
    );

    if (existingSalon) {
      console.log(`Salon "${salonSlug}" already exists. Skipping seed.`);
      return;
    }

    const passwordHash = await bcrypt.hash("Password@123", 10);
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const businessHours = {
      0: { start_time: "09:00", end_time: "21:00" },
      1: { start_time: "09:00", end_time: "21:00" },
      2: { start_time: "09:00", end_time: "21:00" },
      3: { start_time: "09:00", end_time: "21:00" },
      4: { start_time: "09:00", end_time: "21:00" },
      5: { start_time: "09:00", end_time: "21:00" },
      6: { start_time: "10:00", end_time: "20:00" },
    };

    const allowedPaymentPolicies = ["pay_at_venue", "full_upfront"];

    const salonLogo = "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=800&q=80";
    const salonPhotos = [
      {
        url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
        secure_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
        public_id: "salon-management-service/salons/demo-salon-interior-1",
        format: "webp",
        resource_type: "image",
        bytes: 142580,
        type: "upload",
        asset_folder: "salon-management-service/salons",
        filename: "salon-interior-lounge.webp",
      },
      {
        url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
        secure_url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
        public_id: "salon-management-service/salons/demo-salon-interior-2",
        format: "webp",
        resource_type: "image",
        bytes: 135240,
        type: "upload",
        asset_folder: "salon-management-service/salons",
        filename: "salon-styling-stations.webp",
      },
      {
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        secure_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        public_id: "salon-management-service/salons/demo-salon-interior-3",
        format: "webp",
        resource_type: "image",
        bytes: 128910,
        type: "upload",
        asset_folder: "salon-management-service/salons",
        filename: "salon-shampoo-spa-suites.webp",
      },
    ];

    await queryInterface.bulkInsert("salons", [
      {
        uuid: crypto.randomUUID(),
        name: "Aura Luxury",
        email: salonEmail,
        password: passwordHash,
        phone: "9876543210",
        address: "Plot 42, Sector 18, Cyber Hub Road, Gurugram, Haryana 122008",
        latitude: 28.4912,
        longitude: 77.0864,
        map_link: "https://www.google.com/maps?q=28.4912,77.0864",
        owner_name: "Aarav Mehta",
        type: "unisex",
        about: "A sanctuary for bespoke haircare revitalizing skin rituals and luxury styling",
        is_onboarded: true,
        is_active: true,
        logo: salonLogo,
        photos: JSON.stringify(salonPhotos),
        slug: salonSlug,
        storefront_theme_id: 1,
        registered_by: "self",
        subscription_plan: "yearly",
        subscription_status: "active",
        subscription_expires_at: oneYearLater,
        trial_ends_at: null,
        business_hours: JSON.stringify(businessHours),
        allowed_payment_policies: JSON.stringify(allowedPaymentPolicies),
        created_at: now,
        updated_at: now,
      },
    ]);

    const salonId = await queryInterface.rawSelect(
      "salons",
      {
        where: { slug: salonSlug },
      },
      ["id"]
    );

    const categoriesData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Hair Artistry & Styling",
        description: "Precision haircuts, artisanal blowouts, and signature styling.",
        logo: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Color & Highlights",
        description: "Dimensional balayage, gloss treatments, and bespoke color transformations.",
        logo: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Skin & Facial Rituals",
        description: "Hydrating facials, deep cleansing dermabrasion, and anti-aging therapies.",
        logo: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Nail Lounge & Spa",
        description: "Luxury manicures, restorative pedicures, and nail art enhancements.",
        logo: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Massage & Wellness",
        description: "Therapeutic deep pressure, Swedish relaxation, and herbal body rituals.",
        logo: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("categories", categoriesData);

    const categories = await queryInterface.sequelize.query(
      `SELECT id, name FROM "categories" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name] = c.id;
    });

    const servicesData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Hair Artistry & Styling"],
        name: "Signature Botanical Hair Spa & Blowout",
        description: "Nourishing botanical hair spa with relaxing scalp massage and sleek blowdry finish.",
        logo: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
        price: 1499,
        duration: 60,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Color & Highlights"],
        name: "Golden Honey Balayage & Gloss",
        description: "Hand-painted sun-kissed dimensional balayage finished with an illuminating shine glaze.",
        logo: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
        price: 4999,
        duration: 150,
        gender: "female",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Skin & Facial Rituals"],
        name: "Cellular Glow Hydra-Facial",
        description: "Multi-step medical-grade hydra-dermabrasion extraction with deep antioxidant infusion.",
        logo: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
        price: 2899,
        duration: 60,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Nail Lounge & Spa"],
        name: "Royal Rose & Warm Milk Pedicure",
        description: "Petal-infused warm milk soak followed by gentle exfoliation, mask, and reflex massage.",
        logo: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
        price: 1199,
        duration: 45,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Massage & Wellness"],
        name: "Aromatherapy Deep Tissue Therapy",
        description: "Therapeutic deep pressure therapy infused with organic lavender and eucalyptus oils.",
        logo: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
        price: 2499,
        duration: 60,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("services", servicesData);

    const services = await queryInterface.sequelize.query(
      `SELECT id, name, price, duration, price_type FROM "services" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const servMap = {};
    services.forEach((s) => {
      servMap[s.name] = s;
    });

    const subServicesData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Hair Artistry & Styling"],
        parent_id: servMap["Signature Botanical Hair Spa & Blowout"].id,
        name: "Express Scalp Purify & Blowout",
        description: "Quick 30-min scalp detoxification and high-volume blowout styling.",
        logo: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80",
        price: 899,
        duration: 30,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Hair Artistry & Styling"],
        parent_id: servMap["Signature Botanical Hair Spa & Blowout"].id,
        name: "Intense Caviar & Keratin Moisture Infusion",
        description: "Deep conditioning caviar masque infused under steam with ultrasonic iron.",
        logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        price: 1999,
        duration: 75,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Hair Artistry & Styling"],
        parent_id: servMap["Signature Botanical Hair Spa & Blowout"].id,
        name: "Thermal Silk Press & Gloss Finish",
        description: "Heat-protected precision silk press leaving strands glossy and lightweight.",
        logo: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80",
        price: 1299,
        duration: 45,
        gender: "female",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },

      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Color & Highlights"],
        parent_id: servMap["Golden Honey Balayage & Gloss"].id,
        name: "Face-Framing Money Piece Highlights",
        description: "Targeted sun-drenched highlight placement along the front hairline.",
        logo: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
        price: 2499,
        duration: 60,
        gender: "female",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Color & Highlights"],
        parent_id: servMap["Golden Honey Balayage & Gloss"].id,
        name: "Acidic Color Gloss & Tone Refresh",
        description: "Translucent demi-permanent gloss restoring vibrancy and neutralizing brass.",
        logo: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80",
        price: 1799,
        duration: 45,
        gender: "female",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Color & Highlights"],
        parent_id: servMap["Golden Honey Balayage & Gloss"].id,
        name: "Full Platinum Root Melt & Balayage",
        description: "Complete dimensional lift from root to tip with seamless root melting.",
        logo: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80",
        price: 5999,
        duration: 180,
        gender: "female",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },

      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Skin & Facial Rituals"],
        parent_id: servMap["Cellular Glow Hydra-Facial"].id,
        name: "LED Photon Light Therapy Add-on",
        description: "Targeted blue & red LED phototherapy to kill acne bacteria and stimulate collagen.",
        logo: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=600&q=80",
        price: 899,
        duration: 25,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Skin & Facial Rituals"],
        parent_id: servMap["Cellular Glow Hydra-Facial"].id,
        name: "Oxygen Infusion & Hyaluronic Plumping",
        description: "High-pressure hyperbaric oxygen mist delivery of pure hyaluronic serum.",
        logo: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80",
        price: 1599,
        duration: 40,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Skin & Facial Rituals"],
        parent_id: servMap["Cellular Glow Hydra-Facial"].id,
        name: "Cryo-Sculpting Facial Drainage",
        description: "Sub-zero cryo wand toning paired with lymphatic acupressure drainage.",
        logo: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
        price: 1299,
        duration: 30,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },

      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Nail Lounge & Spa"],
        parent_id: servMap["Royal Rose & Warm Milk Pedicure"].id,
        name: "Warm Paraffin Wax Smoothing Wrap",
        description: "Deep moisturizing heated lavender paraffin wax wrap for velvet-soft soles.",
        logo: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80",
        price: 499,
        duration: 20,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Nail Lounge & Spa"],
        parent_id: servMap["Royal Rose & Warm Milk Pedicure"].id,
        name: "Gel Lacquer Long-Wear Polish Upgrade",
        description: "LED-cured smudge-proof gel polish application lasting 3+ weeks.",
        logo: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80",
        price: 699,
        duration: 25,
        gender: "female",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Nail Lounge & Spa"],
        parent_id: servMap["Royal Rose & Warm Milk Pedicure"].id,
        name: "Hot Basalt Stone Foot Reflexology",
        description: "Warmed volcanic stones soothing tired arch pressure points and calves.",
        logo: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80",
        price: 799,
        duration: 30,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },

      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Massage & Wellness"],
        parent_id: servMap["Aromatherapy Deep Tissue Therapy"].id,
        name: "Upper Back, Neck & Shoulder Relief",
        description: "Targeted myofascial release for desk workers relieve chronic trapezius tension.",
        logo: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
        price: 1399,
        duration: 30,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Massage & Wellness"],
        parent_id: servMap["Aromatherapy Deep Tissue Therapy"].id,
        name: "Warm Herbal Compress Body Ritual",
        description: "Steamed organic Thai herbal poultices boosting blood flow and muscle ease.",
        logo: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80",
        price: 1899,
        duration: 45,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: false,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: catMap["Massage & Wellness"],
        parent_id: servMap["Aromatherapy Deep Tissue Therapy"].id,
        name: "Full 90-Min Sensory Reset & Scalp Shiatsu",
        description: "Extended whole-body restorative massage with warm oil scalp shiatsu.",
        logo: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80",
        price: 3299,
        duration: 90,
        gender: "unisex",
        price_type: "fixed",
        is_active: true,
        is_popular: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("services", subServicesData);

    const allServices = await queryInterface.sequelize.query(
      `SELECT id, name, price, duration, price_type FROM "services" WHERE salon_id = ${salonId};`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    allServices.forEach((s) => {
      servMap[s.name] = s;
    });

    const staffSchedule = {
      0: { start_time: "10:00", end_time: "18:00" },
      1: { start_time: "09:00", end_time: "20:00" },
      2: { start_time: "09:00", end_time: "20:00" },
      3: { start_time: "09:00", end_time: "20:00" },
      4: { start_time: "09:00", end_time: "20:00" },
      5: { start_time: "09:00", end_time: "20:00" },
      6: { start_time: "09:00", end_time: "20:00" },
    };

    const staffData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Aarav",
        last_name: "Mehta",
        email: "aarav.stylist@example.com",
        phone_number: "9876510001",
        dob: "12-05-1992",
        title: "Creative Director & Hair Stylist",
        joining_date: "01-01-2023",
        address: "Sector 14, Gurugram, Haryana",
        gender: "male",
        emergency_contact: JSON.stringify({ name: "Kavita Mehta", phone: "9876500001", relation: "Spouse" }),
        active_hours: JSON.stringify(staffSchedule),
        photos: JSON.stringify({
          url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
          secure_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
          public_id: "salon-management-service/staff/aarav-mehta",
          format: "webp",
          resource_type: "image",
          bytes: 42150,
          type: "upload",
          asset_folder: "salon-management-service/staff",
          filename: "aarav-mehta.webp",
        }),
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Priya",
        last_name: "Sharma",
        email: "priya.skin@example.com",
        phone_number: "9876510002",
        dob: "18-09-1995",
        title: "Senior Esthetician & Skin Specialist",
        joining_date: "15-03-2023",
        address: "DLF Phase 2, Gurugram, Haryana",
        gender: "female",
        emergency_contact: JSON.stringify({ name: "Ramesh Sharma", phone: "9876500002", relation: "Father" }),
        active_hours: JSON.stringify(staffSchedule),
        photos: JSON.stringify({
          url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
          secure_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
          public_id: "salon-management-service/staff/priya-sharma",
          format: "webp",
          resource_type: "image",
          bytes: 38920,
          type: "upload",
          asset_folder: "salon-management-service/staff",
          filename: "priya-sharma.webp",
        }),
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Rohan",
        last_name: "Verma",
        email: "rohan.color@example.com",
        phone_number: "9876510003",
        dob: "22-11-1993",
        title: "Master Colorist",
        joining_date: "01-06-2023",
        address: "Sushant Lok 1, Gurugram, Haryana",
        gender: "male",
        emergency_contact: JSON.stringify({ name: "Neha Verma", phone: "9876500003", relation: "Sister" }),
        active_hours: JSON.stringify(staffSchedule),
        photos: JSON.stringify({
          url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
          secure_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
          public_id: "salon-management-service/staff/rohan-verma",
          format: "webp",
          resource_type: "image",
          bytes: 45110,
          type: "upload",
          asset_folder: "salon-management-service/staff",
          filename: "rohan-verma.webp",
        }),
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        first_name: "Ananya",
        last_name: "Iyer",
        email: "ananya.wellness@example.com",
        phone_number: "9876510004",
        dob: "08-03-1996",
        title: "Wellness & Nail Therapist",
        joining_date: "10-08-2023",
        address: "Golf Course Road, Gurugram, Haryana",
        gender: "female",
        emergency_contact: JSON.stringify({ name: "Suresh Iyer", phone: "9876500004", relation: "Brother" }),
        active_hours: JSON.stringify(staffSchedule),
        photos: JSON.stringify({
          url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
          secure_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
          public_id: "salon-management-service/staff/ananya-iyer",
          format: "webp",
          resource_type: "image",
          bytes: 41200,
          type: "upload",
          asset_folder: "salon-management-service/staff",
          filename: "ananya-iyer.webp",
        }),
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("staffs", staffData);

    const staffMembers = await queryInterface.sequelize.query(
      `SELECT id, first_name FROM "staffs" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const staffMap = {};
    staffMembers.forEach((st) => {
      staffMap[st.first_name] = st.id;
    });

    const staffServicesData = [
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Aarav"],
        service_id: servMap["Signature Botanical Hair Spa & Blowout"].id,
        duration: servMap["Signature Botanical Hair Spa & Blowout"].duration,
        price_type: servMap["Signature Botanical Hair Spa & Blowout"].price_type,
        price: servMap["Signature Botanical Hair Spa & Blowout"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Rohan"],
        service_id: servMap["Golden Honey Balayage & Gloss"].id,
        duration: servMap["Golden Honey Balayage & Gloss"].duration,
        price_type: servMap["Golden Honey Balayage & Gloss"].price_type,
        price: servMap["Golden Honey Balayage & Gloss"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Priya"],
        service_id: servMap["Cellular Glow Hydra-Facial"].id,
        duration: servMap["Cellular Glow Hydra-Facial"].duration,
        price_type: servMap["Cellular Glow Hydra-Facial"].price_type,
        price: servMap["Cellular Glow Hydra-Facial"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Royal Rose & Warm Milk Pedicure"].id,
        duration: servMap["Royal Rose & Warm Milk Pedicure"].duration,
        price_type: servMap["Royal Rose & Warm Milk Pedicure"].price_type,
        price: servMap["Royal Rose & Warm Milk Pedicure"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Aromatherapy Deep Tissue Therapy"].id,
        duration: servMap["Aromatherapy Deep Tissue Therapy"].duration,
        price_type: servMap["Aromatherapy Deep Tissue Therapy"].price_type,
        price: servMap["Aromatherapy Deep Tissue Therapy"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Aarav"],
        service_id: servMap["Express Scalp Purify & Blowout"].id,
        duration: servMap["Express Scalp Purify & Blowout"].duration,
        price_type: servMap["Express Scalp Purify & Blowout"].price_type,
        price: servMap["Express Scalp Purify & Blowout"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Aarav"],
        service_id: servMap["Intense Caviar & Keratin Moisture Infusion"].id,
        duration: servMap["Intense Caviar & Keratin Moisture Infusion"].duration,
        price_type: servMap["Intense Caviar & Keratin Moisture Infusion"].price_type,
        price: servMap["Intense Caviar & Keratin Moisture Infusion"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Aarav"],
        service_id: servMap["Thermal Silk Press & Gloss Finish"].id,
        duration: servMap["Thermal Silk Press & Gloss Finish"].duration,
        price_type: servMap["Thermal Silk Press & Gloss Finish"].price_type,
        price: servMap["Thermal Silk Press & Gloss Finish"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Rohan"],
        service_id: servMap["Face-Framing Money Piece Highlights"].id,
        duration: servMap["Face-Framing Money Piece Highlights"].duration,
        price_type: servMap["Face-Framing Money Piece Highlights"].price_type,
        price: servMap["Face-Framing Money Piece Highlights"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Rohan"],
        service_id: servMap["Acidic Color Gloss & Tone Refresh"].id,
        duration: servMap["Acidic Color Gloss & Tone Refresh"].duration,
        price_type: servMap["Acidic Color Gloss & Tone Refresh"].price_type,
        price: servMap["Acidic Color Gloss & Tone Refresh"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Rohan"],
        service_id: servMap["Full Platinum Root Melt & Balayage"].id,
        duration: servMap["Full Platinum Root Melt & Balayage"].duration,
        price_type: servMap["Full Platinum Root Melt & Balayage"].price_type,
        price: servMap["Full Platinum Root Melt & Balayage"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Priya"],
        service_id: servMap["LED Photon Light Therapy Add-on"].id,
        duration: servMap["LED Photon Light Therapy Add-on"].duration,
        price_type: servMap["LED Photon Light Therapy Add-on"].price_type,
        price: servMap["LED Photon Light Therapy Add-on"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Priya"],
        service_id: servMap["Oxygen Infusion & Hyaluronic Plumping"].id,
        duration: servMap["Oxygen Infusion & Hyaluronic Plumping"].duration,
        price_type: servMap["Oxygen Infusion & Hyaluronic Plumping"].price_type,
        price: servMap["Oxygen Infusion & Hyaluronic Plumping"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Priya"],
        service_id: servMap["Cryo-Sculpting Facial Drainage"].id,
        duration: servMap["Cryo-Sculpting Facial Drainage"].duration,
        price_type: servMap["Cryo-Sculpting Facial Drainage"].price_type,
        price: servMap["Cryo-Sculpting Facial Drainage"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Warm Paraffin Wax Smoothing Wrap"].id,
        duration: servMap["Warm Paraffin Wax Smoothing Wrap"].duration,
        price_type: servMap["Warm Paraffin Wax Smoothing Wrap"].price_type,
        price: servMap["Warm Paraffin Wax Smoothing Wrap"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Gel Lacquer Long-Wear Polish Upgrade"].id,
        duration: servMap["Gel Lacquer Long-Wear Polish Upgrade"].duration,
        price_type: servMap["Gel Lacquer Long-Wear Polish Upgrade"].price_type,
        price: servMap["Gel Lacquer Long-Wear Polish Upgrade"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Hot Basalt Stone Foot Reflexology"].id,
        duration: servMap["Hot Basalt Stone Foot Reflexology"].duration,
        price_type: servMap["Hot Basalt Stone Foot Reflexology"].price_type,
        price: servMap["Hot Basalt Stone Foot Reflexology"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Upper Back, Neck & Shoulder Relief"].id,
        duration: servMap["Upper Back, Neck & Shoulder Relief"].duration,
        price_type: servMap["Upper Back, Neck & Shoulder Relief"].price_type,
        price: servMap["Upper Back, Neck & Shoulder Relief"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Warm Herbal Compress Body Ritual"].id,
        duration: servMap["Warm Herbal Compress Body Ritual"].duration,
        price_type: servMap["Warm Herbal Compress Body Ritual"].price_type,
        price: servMap["Warm Herbal Compress Body Ritual"].price,
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        staff_id: staffMap["Ananya"],
        service_id: servMap["Full 90-Min Sensory Reset & Scalp Shiatsu"].id,
        duration: servMap["Full 90-Min Sensory Reset & Scalp Shiatsu"].duration,
        price_type: servMap["Full 90-Min Sensory Reset & Scalp Shiatsu"].price_type,
        price: servMap["Full 90-Min Sensory Reset & Scalp Shiatsu"].price,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("staff_services", staffServicesData);

    const itemCategoriesData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Haircare & Treatments",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Professional Colors & Lighteners",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Skincare & Facial Formulations",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        name: "Salon Essentials & Disposables",
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("items_category", itemCategoriesData);

    const itemCategories = await queryInterface.sequelize.query(
      `SELECT id, name FROM "items_category" WHERE salon_id = ${salonId} ORDER BY id ASC;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const itemCatMap = {};
    itemCategories.forEach((ic) => {
      itemCatMap[ic.name] = ic.id;
    });

    const inventoryItemsData = [
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Haircare & Treatments"],
        item_type: "product",
        name: "Olaplex No. 4 Bond Maintenance Shampoo",
        brand: "Olaplex",
        variant_name: "Original 250ml",
        unit: "250ml",
        unit_price: 2850.0,
        current_stock: 24,
        min_stock_level: 5,
        logo: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Haircare & Treatments"],
        item_type: "product",
        name: "Moroccanoil Treatment Original",
        brand: "Moroccanoil",
        variant_name: "Argan Oil 100ml",
        unit: "100ml",
        unit_price: 3150.0,
        current_stock: 18,
        min_stock_level: 4,
        logo: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Professional Colors & Lighteners"],
        item_type: "product",
        name: "Majirel Cool Inforced 6.1 Ash Brown",
        brand: "L'Oreal Professionnel",
        variant_name: "Shade 6.1",
        unit: "50g",
        unit_price: 450.0,
        current_stock: 40,
        min_stock_level: 10,
        logo: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Professional Colors & Lighteners"],
        item_type: "product",
        name: "Blondme Premium Lightener 9+ Dust-Free",
        brand: "Schwarzkopf",
        variant_name: "9+ Lift 450g",
        unit: "450g",
        unit_price: 2400.0,
        current_stock: 12,
        min_stock_level: 3,
        logo: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Skincare & Facial Formulations"],
        item_type: "product",
        name: "Daily Microfoliant Gentle Rice Exfoliator",
        brand: "Dermalogica",
        variant_name: "Powder 74g",
        unit: "74g",
        unit_price: 4200.0,
        current_stock: 15,
        min_stock_level: 3,
        logo: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Skincare & Facial Formulations"],
        item_type: "product",
        name: "Sensibio H2O Soothing Micellar Cleansing Water",
        brand: "Bioderma",
        variant_name: "Sensitive Skin 500ml",
        unit: "500ml",
        unit_price: 1199.0,
        current_stock: 20,
        min_stock_level: 5,
        logo: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Salon Essentials & Disposables"],
        item_type: "product",
        name: "Professional Nitrile Gloves (Black)",
        brand: "SafeTouch",
        variant_name: "Size M (Box of 100)",
        unit: "100 pcs",
        unit_price: 650.0,
        current_stock: 35,
        min_stock_level: 10,
        logo: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
      {
        uuid: crypto.randomUUID(),
        salon_id: salonId,
        category_id: itemCatMap["Salon Essentials & Disposables"],
        item_type: "product",
        name: "Biodegradable Luxury Salon Towels",
        brand: "EcoSalon",
        variant_name: "White 40x80cm (Pack of 50)",
        unit: "50 pcs",
        unit_price: 450.0,
        current_stock: 50,
        min_stock_level: 15,
        logo: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=600&q=80",
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("inventory_items", inventoryItemsData);

    const insertedItems = await queryInterface.sequelize.query(
      `SELECT id, current_stock FROM "inventory_items" WHERE salon_id = ${salonId};`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const transactionsData = insertedItems.map((item) => ({
      uuid: crypto.randomUUID(),
      salon_id: salonId,
      item_id: item.id,
      ordered_quantity: item.current_stock,
      received_quantity: item.current_stock,
      damaged_quantity: 0,
      created_at: now,
      updated_at: now,
    }));

    if (transactionsData.length > 0) {
      await queryInterface.bulkInsert("inventory_transactions", transactionsData);
    }

    console.log(`Successfully seeded demo salon "Aura Luxury Salon & Spa" (slug: ${salonSlug}) with full categories, services, staff, and inventory.`);
  },

  async down(queryInterface, Sequelize) {
    const salonSlug = "glow";
    const salon = await queryInterface.rawSelect(
      "salons",
      {
        where: { slug: salonSlug },
      },
      ["id"]
    );

    if (!salon) return;

    await queryInterface.bulkDelete("inventory_transactions", { salon_id: salon }, {});
    await queryInterface.bulkDelete("inventory_items", { salon_id: salon }, {});
    await queryInterface.bulkDelete("items_category", { salon_id: salon }, {});
    const staffRows = await queryInterface.sequelize.query(
      `SELECT id FROM "staffs" WHERE salon_id = ${salon};`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const staffIds = (staffRows || []).map((s) => s.id);
    if (staffIds.length > 0) {
      await queryInterface.bulkDelete(
        "staff_services",
        {
          staff_id: { [Sequelize.Op.in]: staffIds },
        },
        {}
      );
    }
    await queryInterface.bulkDelete("staffs", { salon_id: salon }, {});
    await queryInterface.bulkDelete("services", { salon_id: salon }, {});
    await queryInterface.bulkDelete("categories", { salon_id: salon }, {});
    await queryInterface.bulkDelete("salons", { id: salon }, {});

    console.log(`Successfully removed demo salon "${salonSlug}".`);
  },
};
