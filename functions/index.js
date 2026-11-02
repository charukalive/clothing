/**
 * Cloud Functions for Mandara Fashion - Sri Lankan Luxury Clothing & Apparel Platform
 * Node.js 22 Runtime
 */

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Health probe for local emulator isolation (Fail-Closed)
 */
exports.probeEmulatorHealth = onRequest({ cors: true }, (req, res) => {
  const isEmulator = Boolean(process.env.FUNCTIONS_EMULATOR || process.env.FIRESTORE_EMULATOR_HOST);
  res.status(200).json({
    status: "healthy",
    service: "Mandara Fashion Ceylon Backend",
    isEmulator,
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. createGuestOrder: Secure guest checkout callable function
 * Validates items against server-side prices, verifies stock, prevents double-submission via idempotency,
 * and generates a unique Order ID and private access token.
 */
exports.createGuestOrder = onCall({ cors: true }, async (request) => {
  const { customer, items, paymentMethod, idempotencyKey } = request.data || {};

  // Input validation
  if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city) {
    throw new HttpsError("invalid-argument", "Customer details (name, phone, address, city) are required.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError("invalid-argument", "Order must contain at least one apparel item.");
  }

  // Check idempotency key to prevent double submits
  if (idempotencyKey) {
    const idemRef = db.collection("idempotencyKeys").doc(idempotencyKey);
    const idemDoc = await idemRef.get();
    if (idemDoc.exists) {
      return idemDoc.data().result;
    }
  }

  // Verify items and calculate subtotal using verified database prices
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    if (!item.id || !item.quantity || item.quantity <= 0) {
      throw new HttpsError("invalid-argument", "Invalid item payload.");
    }

    const prodDoc = await db.collection("products").doc(item.id).get();
    if (!prodDoc.exists) {
      throw new HttpsError("not-found", `Product ${item.id} is no longer available.`);
    }

    const prodData = prodDoc.data();
    if (!prodData.published || prodData.archived) {
      throw new HttpsError("failed-precondition", `Product ${prodData.name} is not available for purchase.`);
    }

    if (prodData.stock < item.quantity) {
      throw new HttpsError("resource-exhausted", `Insufficient stock for ${prodData.name}. Only ${prodData.stock} units remaining.`);
    }

    const itemTotal = prodData.price * item.quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      id: item.id,
      name: prodData.name,
      price: prodData.price,
      quantity: item.quantity,
      size: item.size || "Standard",
      colour: item.colour || { name: "Natural", hex: "#E7DED3" },
      total: itemTotal
    });
  }

  // Islandwide delivery calculation
  const deliveryFee = (subtotal >= 10000 || customer.city.includes("Colombo 01-15")) ? 0 : 450;
  const total = subtotal + deliveryFee;

  // Generate unique Order ID & Access Token
  const timestamp = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ORD-${timestamp.toString().slice(-4)}${rand}`;
  const rawToken = crypto.randomBytes(6).toString("hex").toUpperCase();
  const accessToken = `AT-${rawToken}`;

  const orderPayload = {
    orderId,
    accessToken,
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: (customer.email || "").trim(),
      address: customer.address.trim(),
      city: customer.city.trim(),
      notes: (customer.notes || "").trim()
    },
    items: verifiedItems,
    subtotal,
    deliveryFee,
    total,
    paymentMethod: paymentMethod === "BankTransfer" ? "BankTransfer" : "COD",
    status: "pending",
    courier: "Pronto Logistics Sri Lanka",
    trackingNumber: "",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const batch = db.batch();
  const orderRef = db.collection("orders").doc(orderId);
  batch.set(orderRef, orderPayload);

  // Decrement inventory
  for (const it of verifiedItems) {
    const pRef = db.collection("products").doc(it.id);
    batch.update(pRef, {
      stock: admin.firestore.FieldValue.increment(-it.quantity)
    });
  }

  // Save idempotency key record
  if (idempotencyKey) {
    const idemRef = db.collection("idempotencyKeys").doc(idempotencyKey);
    batch.set(idemRef, {
      result: { orderId, accessToken, total },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();

  return {
    orderId,
    accessToken,
    total,
    status: "pending"
  };
});

/**
 * 2. updateOrderStatus: Admin callable function
 * Updates order progression, assigned courier, and waybill number.
 */
exports.updateOrderStatus = onCall({ cors: true }, async (request) => {
  const auth = request.auth;
  if (!auth || (!auth.token.admin && auth.token.email !== "admin@mandarafashion.lk")) {
    throw new HttpsError("permission-denied", "Only Mandara Fashion staff may update order status.");
  }

  const { orderId, status, courier, trackingNumber } = request.data || {};
  if (!orderId || !status) {
    throw new HttpsError("invalid-argument", "Order ID and status are required.");
  }

  const validStatuses = ["pending", "confirmed", "packing", "dispatched", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new HttpsError("invalid-argument", `Status must be one of: ${validStatuses.join(", ")}`);
  }

  const orderRef = db.collection("orders").doc(orderId);
  await orderRef.update({
    status,
    courier: courier || "Pronto Logistics Sri Lanka",
    trackingNumber: trackingNumber || "",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, orderId, status };
});

/**
 * 3. syncPublicProduct: Firestore trigger on products/{productId}
 * Enforces dual projection by automatically updating publicProducts/{productId}.
 * Strips internal fields (cost, margin, admin notes) so customers cannot access cost prices.
 */
exports.syncPublicProduct = onDocumentWritten("products/{productId}", async (event) => {
  const productId = event.params.productId;
  const afterDoc = event.data.after;

  const publicRef = db.collection("publicProducts").doc(productId);

  if (!afterDoc.exists) {
    await publicRef.delete();
    return;
  }

  const data = afterDoc.data();
  if (!data.published || data.archived) {
    await publicRef.delete();
    return;
  }

  const sanitizedPublic = {
    id: productId,
    name: data.name,
    category: data.category,
    price: data.price,
    stock: data.stock,
    description: data.description || "",
    image: data.image,
    sizes: data.sizes || [],
    colours: data.colours || [],
    published: true,
    updatedAt: data.updatedAt || admin.firestore.FieldValue.serverTimestamp()
  };

  await publicRef.set(sanitizedPublic, { merge: true });
});
