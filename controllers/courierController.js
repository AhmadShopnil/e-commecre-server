import { connectToDatabase } from "../config/db.js";

// @desc    Check consignment status
// @route   GET /api/courier/check-status
export const checkCourierStatus = async (req, res) => {
    const { consignmentId } = req.query;

    if (!consignmentId) {
        return res.status(400).json({ error: 'Consignment ID is required' });
    }

    try {
        const { db } = await connectToDatabase();
        const settings = await db.collection('settings').findOne({ type: 'courier' });

        const provider = settings?.providers?.find(p => p.isActive && (p.name.includes("Steadfast") || p.baseUrl?.includes("packzy")));

        if (!provider || !provider.apiKey || !provider.secretKey) {
            return res.status(400).json({ error: 'Steadfast API credentials not configured' });
        }

        const BASE_URL = provider.baseUrl || 'https://portal.packzy.com/api/v1';
        const headers = {
            'Api-Key': provider.apiKey,
            'Secret-Key': provider.secretKey,
            'Content-Type': 'application/json'
        };

        const response = await fetch(`${BASE_URL}/status_by_cid/${consignmentId}`, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (data.status === 200) {
            // Update order status in DB
            await db.collection('orders').updateOne(
                { courierConsignmentId: parseInt(consignmentId) },
                {
                    $set: {
                        courierStatus: data.delivery_status,
                        courierLastChecked: new Date()
                    }
                }
            );
        }

        res.json(data);
    } catch (error) {
        console.error('Steadfast Status API Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Create courier order (Steadyfast)
// @route   POST /api/courier/create-order
export const createCourierOrder = async (req, res) => {
    try {
        const { db } = await connectToDatabase();

        // Get Credentials
        let settings = await db.collection("settings").findOne({ type: "courier" });
        let provider = settings?.providers?.find(
            p =>
                p.isActive &&
                (p.name?.toLowerCase().includes("steadfast") ||
                    p.baseUrl?.includes("packzy"))
        );

        let apiKey = provider?.apiKey;
        let secretKey = provider?.secretKey;
        let baseUrl = provider?.baseUrl || "https://portal.packzy.com/api/v1";

        if (!apiKey || !secretKey) {
            const general = await db.collection("settings").findOne({ type: "general" });
            apiKey = general?.steadfastApiKey;
            secretKey = general?.steadfastSecretKey;
        }

        if (!apiKey || !secretKey) {
            return res.status(400).json({ error: "Steadfast API credentials not configured" });
        }

        const { orders } = req.body;

        if (!Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ error: "Orders array required" });
        }

        const headers = {
            "Api-Key": apiKey,
            "Secret-Key": secretKey,
            "Content-Type": "application/json"
        };

        const sanitizePhone = phone => {
            if (!phone) return "";
            const p = phone.replace(/\D/g, "");
            if (p.length === 10 && p.startsWith("1")) return "0" + p;
            return p;
        };

        const mappedOrders = orders.map(order => ({
            invoice: order.invoice,
            recipient_name: order.recipient_name,
            recipient_address: order.recipient_address,
            recipient_phone: sanitizePhone(order.recipient_phone),
            cod_amount: Number(order.cod_amount) || 0,
            note: order.note || "",
            delivery_type: 0
        }));

        // Strict validation
        for (const o of mappedOrders) {
            if (!o.invoice || !o.recipient_phone || o.recipient_phone.length !== 11) {
                return res.status(400).json({ error: `Invalid order data for invoice ${o.invoice}` });
            }
        }

        let result;

        // SINGLE ORDER
        if (mappedOrders.length === 1) {
            const response = await fetch(`${baseUrl}/create_order`, {
                method: "POST",
                headers,
                body: JSON.stringify(mappedOrders[0])
            });

            result = await response.json();

            if (result?.status === 200 && result?.consignment) {
                await db.collection("orders").updateOne(
                    { orderNumber: result.consignment.invoice },
                    {
                        $set: {
                            courierConsignmentId: result.consignment.consignment_id,
                            courierTrackingCode: result.consignment.tracking_code,
                            courierStatus: "sent_to_courier"
                        }
                    }
                );
            }

            return res.json(result);
        }

        // BULK ORDER
        const response = await fetch(`${baseUrl}/create_order/bulk-order`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                data: JSON.stringify(mappedOrders)
            })
        });

        result = await response.json();

        if (Array.isArray(result)) {
            const bulkOps = result
                .filter(r => r.status === "success")
                .map(r => ({
                    updateOne: {
                        filter: { orderNumber: r.invoice },
                        update: {
                            $set: {
                                courierConsignmentId: r.consignment_id,
                                courierTrackingCode: r.tracking_code,
                                courierStatus: "sent_to_courier"
                            }
                        }
                    }
                }));

            if (bulkOps.length) {
                await db.collection("orders").bulkWrite(bulkOps);
            }
        }

        res.json(result);
    } catch (err) {
        console.error("Steadfast Error:", err);
        res.status(500).json({ error: err.message });
    }
};
