const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");

const db = require("../db");

router.get("/", async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM invoices;`);
        return res.json({ "invoices": result.rows });
    }
    catch (err) {
        return next(err)
    }
})

router.get("/:id", async (req, res, next) => {
    try {
        const invoiceId = req.params.id

        const result = await db.query(`SELECT * FROM invoices WHERE id=$1;`, [invoiceId]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice #${invoiceId} not found`, 404);
        }

        const info = result.rows[0];
        const compInfo = await db.query(`SELECT * FROM companies WHERE code=$1`, [info.comp_code])
        info.company = compInfo.rows;

        return res.json(info);
    }
    catch (err) {
        return next(err)
    }
})

router.post("/", async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body

        const compInfo = await db.query(`SELECT * FROM invoices WHERE comp_code=$1;`, [comp_code])
        if (compInfo.rows.length === 0) {
            throw new ExpressError(`Company code "${comp_code}" not found`, 404);
        }

        const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING *;`, [comp_code, amt]);

        return res.json({ "invoice": result.rows[0] });
    }
    catch (err) {
        return next(err)
    }
})

router.put("/:id", async (req, res, next) => {
    try {
        const invoiceId = req.params.id;
        const result = await db.query(`SELECT * FROM invoices WHERE id=$1;`, [invoiceId]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice #${invoiceId} not found`, 404);
        }
        const { amt, paid } = req.body;
        let paidDate = result.rows[0].paid_date;

        if (paid === true && result.rows[0].paid === false) {
            paidDate = new Date();
        }

        const updateInvoice = await db.query(`
        UPDATE invoices SET amt=$2, paid_date=$3
        WHERE id = $1
        RETURNING *;
        `, [invoiceId, amt, paidDate]);

        return res.json({ "invoice": updateInvoice.rows });
    }
    catch (err) {
        return next(err);
    }
})

router.delete("/:id", async (req, res, next) => {
    try {
        const invoiceId = req.params.id;
        const result = await db.query(`SELECT * FROM invoices WHERE id=$1;`, [invoiceId]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice #${invoiceId} not found`, 404);
        }

        const deleteInvoice = await db.query(`DELETE FROM invoices WHERE id=$1;`, [invoiceId]);
        return res.json({ "Status": "Deleted" });
    }
    catch (err) {
        return next(err)
    }
})

module.exports = router;