const db = require('./models');

(async () => {
    try {
        console.log('--- Debugging Cart Associations ---');

        // 1. Verify Associations
        if (db.Cart.associations.cart_items) {
            console.log('✅ Cart has association "cart_items"');
        } else {
            console.error('❌ Cart MISSING association "cart_items"');
            console.log('Available associations:', Object.keys(db.Cart.associations));
        }

        // 2. Fetch Last Cart with items
        const lastCart = await db.Cart.findOne({
            order: [['created_at', 'DESC']],
            include: ['cart_items']
        });

        if (lastCart) {
            console.log('Last Cart ID:', lastCart.id);
            console.log('Cart Items:', JSON.stringify(lastCart.cart_items, null, 2));
            console.log('Cart Items Length:', lastCart.cart_items ? lastCart.cart_items.length : 'undefined');
        } else {
            console.log('No Carts found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.sequelize.close();
    }
})();
