exports.normalizeCart= async (cart) =>{
    const customersMap = new Map();

    for (const item of cart.cart_items) {
        const customerIndex = item.customer_index || 0;

        if (!customersMap.has(customerIndex)) {
            customersMap.set(customerIndex, []);
        }

        const service = await serviceRepository.findOne({
            service_id: item.service_id
        });

        let staffIds = [];

        if (item.staff_id) {
            staffIds = [item.staff_id];
        } else {
            const staff = await staffServiceRepository.find(
                { service_id: item.service_id },
                ['staff_id']
            );
            staffIds = staff.map(s => s.staff_id);
        }

        customersMap.get(customerIndex).push({
            serviceId: item.service_id,
            duration: service.duration_minutes,
            staffIds
        });
    }

    return Array.from(customersMap.entries()).map(
        ([customerIndex, services]) => ({
            customerIndex,
            services
        })
    );
}



exports.toMinutesFromDate= (date) =>{
    return date.getHours() * 60 + date.getMinutes();
}

exports.minutes = (h, m = 0) =>{
    return h * 60 + m;
}

exports.subtractIntervals =(workingIntervals, busyIntervals) =>{
    let free = [...workingIntervals];

    for (const busy of busyIntervals) {
        free = free.flatMap(freeSlot => {
            // no overlap
            if (busy.end <= freeSlot.start || busy.start >= freeSlot.end) {
                return [freeSlot];
            }

            const result = [];

            // left part
            if (busy.start > freeSlot.start) {
                result.push({
                    start: freeSlot.start,
                    end: busy.start
                });
            }

            // right part
            if (busy.end < freeSlot.end) {
                result.push({
                    start: busy.end,
                    end: freeSlot.end
                });
            }

            return result;
        });
    }

    return free;
}

