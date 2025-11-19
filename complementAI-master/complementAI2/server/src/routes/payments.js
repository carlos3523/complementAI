import { Router } from "express";
import crypto from "crypto";
import express from "express";

export const payments = Router();

/**
 * POST /api/payments/create
 */
payments.post("/create", async (req, res) => {
  try {
    const { amount } = req.body || {};
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "amount requerido" });
    }

    const buyOrder = `order-${Date.now()}`;
    const sessionId = `sess-${crypto.randomUUID()}`;

    const body = {
      buy_order: buyOrder,
      session_id: sessionId,
      amount: Number(amount),
      return_url: process.env.WEBPAY_RETURN_URL
    };

    const r = await fetch(
      "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions",
      {
        method: "POST",
        headers: {
          "Tbk-Api-Key-Id": process.env.WEBPAY_COMMERCE_CODE,
          "Tbk-Api-Key-Secret": process.env.WEBPAY_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error("[/api/payments/create]", err);
    return res.status(500).json({ error: "Error creando transacción" });
  }
});


/* ============================================================
   SOPORTAR GET Y POST PARA /commit
   ============================================================ */

/**
 * Transbank puede llamar por POST (normal) o GET (fallback)
 * - POST → token_ws viene en req.body
 * - GET → token_ws viene como query param
 */

async function handleCommit(token, res) {
  const r = await fetch(
    `https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
    {
      method: "PUT",
      headers: {
        "Tbk-Api-Key-Id": process.env.WEBPAY_COMMERCE_CODE,
        "Tbk-Api-Key-Secret": process.env.WEBPAY_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  const result = await r.json();
  console.log("✔ Resultado TBK:", result);

  const redirectUrl =
    `${process.env.CLIENT_WEB_URL}/pago-confirmado?token=${encodeURIComponent(token)}`;

  return res.redirect(redirectUrl);
}


// POST (correcto según TBK)
payments.post("/commit", express.urlencoded({ extended: true }), async (req, res) => {
  const token_ws = req.body?.token_ws;
  if (!token_ws) return res.status(400).send("Missing token_ws");
  return handleCommit(token_ws, res);
});

// GET (fallback necesario)
payments.get("/commit", async (req, res) => {
  const token_ws = req.query?.token_ws;
  if (!token_ws) return res.status(400).send("Missing token_ws");
  return handleCommit(token_ws, res);
});