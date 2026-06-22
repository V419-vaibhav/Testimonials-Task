const express = require("express");
const router = express.Router();
const { db } = require('../config/db');

// POST localhost:4000/testimonial/create-testimonial
router.post("/create-testimonial", async (req, res) => {
  try {
    const {
      author_name,
      author_designation,
      author_company,
      author_image,
      rating,
      title,
      message,
      display_order
    } = req.body;

    if (!author_name || !rating || !title || !message) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Missing required fields"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO testimonials
      (
        author_name,
        author_designation,
        author_company,
        author_image,
        rating,
        title,
        message,
        isactive,
        display_order,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        author_name,
        author_designation || null,
        author_company || null,
        author_image || null,
        rating,
        title,
        message,
        1,
        display_order || 0,
        new Date()
      ]
    );

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Testimonial created successfully",
      data: {
        testimonial_id: result.insertId
      }
    });

  } 
  catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Error creating testimonial",
      error: err
    });
  }
});

// GET localhost:4000/testimonial/gettestimonials
router.get("/gettestimonials", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [countResult] = await db.query(
      "SELECT COUNT(*) AS total FROM testimonials WHERE isactive != 0"
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const [testimonials] = await db.query(
      `
      SELECT
        testimonial_id,
        author_name,
        author_designation,
        author_company,
        author_image,
        rating,
        title,
        message,
        isactive,
        display_order,
        created_at
      FROM testimonials
      WHERE isactive != 0
      ORDER BY display_order ASC, testimonial_id DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Testimonials fetched successfully",
      data: testimonials,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        recordPerPage: limit
      }
    });

  } 
  catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Error fetching testimonials",
      error: err
    });
  }
});

// GET localhost:4000/testimonial/gettestimonial/:testimonial_id
router.get("/gettestimonial/:testimonial_id", async (req, res) => {
  try {
    const { testimonial_id } = req.params;

    if (!testimonial_id) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Testimonial ID is required"
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        testimonial_id,
        author_name,
        author_designation,
        author_company,
        author_image,
        rating,
        title,
        message,
        isactive,
        display_order,
        created_at,
        updated_at
      FROM testimonials
      WHERE testimonial_id = ?
      LIMIT 1
      `,
      [testimonial_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Testimonial not found"
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Testimonial fetched successfully",
      data: rows[0]
    });

  } 
  catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Error fetching testimonial",
      error: err
    });
  }
});

// GET localhost:4000/testimonial/active-testimonial
router.get("/active-testimonial", async (req, res) => {
  try {
    const [testimonials] = await db.query(
      `
      SELECT
        testimonial_id,
        author_name,
        author_designation,
        author_company,
        author_image,
        rating,
        title,
        message,
        display_order
      FROM testimonials
      WHERE isactive = 1
      ORDER BY display_order ASC
      `
    );

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Active testimonials fetched successfully",
      data: testimonials
    });

  } 
  catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Error fetching active testimonials",
      error: err
    });
  }
});

// PATCH localhost:4000/testimonial/update-subscription/:testimonial_id
router.patch("/update-testimonial/:testimonial_id", async (req, res) => {
  try {
    const { testimonial_id } = req.params;
    const updates = req.body;

    if (!testimonial_id) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Testimonial ID is required"
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "No fields provided to update"
      });
    }

    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    fields.push("updated_at = ?");
    values.push(new Date());

    values.push(testimonial_id);

    const [result] = await db.query(
      `
      UPDATE testimonials
      SET ${fields.join(", ")}
      WHERE testimonial_id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Testimonial not found"
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Testimonial updated successfully"
    });

  } 
  catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Error updating testimonial",
      error: err
    });
  }
});

// PATCH localhost:4000/testimonial/update-status/:testimonial_id
router.patch("/update-status/:testimonial_id", async (req, res) => {
  try {
    const { testimonial_id } = req.params;
    const { isactive } = req.body;

    if (!testimonial_id) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Testimonial ID is required"
      });
    }

    if (isactive === undefined) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "isactive field is required"
      });
    }

    const [result] = await db.query(
      `
      UPDATE testimonials
      SET isactive = ?, updated_at = ?
      WHERE testimonial_id = ?
      `,
      [isactive, new Date(), testimonial_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Testimonial not found"
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Testimonial status updated successfully"
    });

  } 
  catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Error updating testimonial status",
      error: err
    });
  }
});

// DELETE localhost:4000/testimonial/delete-testimonial/:testimonial_id
router.delete("/delete-testimonial/:testimonial_id", async (req, res) => {
  try {
    const { testimonial_id } = req.params;

    if (!testimonial_id) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Testimonial ID is required"
      });
    }

    const [result] = await db.query(
      `
      UPDATE testimonials
      SET isactive = 0, updated_at = ?
      WHERE testimonial_id = ?
      `,
      [new Date(), testimonial_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Testimonial not found"
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Testimonial deleted successfully"
    });

  } 
  catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Error deleting testimonial",
      error: err
    });
  }
});

module.exports = router;
