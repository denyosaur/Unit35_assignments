const express = require("express");
const router = new express.Router();

const db = require("../db")


/** GET Route for searching companies table in DB to return list of all companies in db*/
router.get("/", async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM companies;`);
        return res.json({ "companies": result.rows });
    }
    catch (err) {
        return next(err);
    }
})

/** GET Route for searching companies table in DB to return specific company passed in through parameter
 * 
 * 
 * returns 404 if company is not found
*/
router.get("/:code", async (req, res, next) => {
    try {
        const comp_code = req.params.code;

        const result = await db.query(`SELECT * FROM companies WHERE code=$1;`, [comp_code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ "company": "Not Found" });
        }

        const invoiceResult = await db.query(`SELECT * FROM invoices WHERE comp_code=$1;`, [comp_code]);
        result.rows[0].invoice = invoiceResult.rows;

        return res.json({ "company": result.rows });
    }
    catch (err) {
        return next(err);
    }
})

/** POST Route for companies table to add new company - add in code, name, and description*/
router.post("/", async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]);
        return res.status(201).json({ "company": result.rows[0] });
    }
    catch (err) {
        return next(err);
    }
})

/*
* PUT Route for companies table to edit company - 
* search company by the code passed in through parameter, 
* and edit name and description from request.body

* returns 404 if company is not found
*/
router.put("/:code", async (req, res, next) => {
    try {
        const comp_code = req.params.code;
        const { name, description } = req.body;

        const company_result = await db.query(`SELECT * FROM companies WHERE code=$1;`, [comp_code])
        if (company_result.rows.length === 0) {
            return res.status(404).json({ "company": "Not Found" });
        }

        const result = await db.query(
            `UPDATE companies SET name=$2, description=$3
            WHERE code = $1
            RETURNING code, name, description`,
            [comp_code, name, description]);
        return res.json({ "company": result.rows[0] });
    }
    catch (err) {
        return next(err);
    }
})


/** GET Route for deleting a company in companies table
 * 
 * returns 404 if company is not found
*/
router.delete("/:code", async (req, res, next) => {
    try {
        const comp_code = req.params.code;

        const company_result = await db.query(`SELECT * FROM companies WHERE code=$1;`, [comp_code]);
        if (company_result.rows.length === 0) {
            return res.status(404).json({ "company": "Not Found" });
        }
        const result = await db.query(`DELETE FROM companies WHERE code=$1;`, [comp_code]);

        return res.json({ "status": "has been deleted" });
    }
    catch (err) {
        return next(err);
    }
})

module.exports = router;