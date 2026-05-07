const express = require('express')
const PDFDocument = require('pdfkit')
const ExcelJS = require('exceljs')
const Expense = require('../models/Expense')
const auth = require('../middleware/auth')
const router = express.Router()

// GET /api/export/pdf
router.get('/pdf', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 })

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=fintrack-report.pdf')
    doc.pipe(res)

    // Header
    doc.fontSize(24).fillColor('#22c55e').text('FinTrack Pro', 50, 50)
    doc.fontSize(12).fillColor('#94a3b8').text('Financial Report', 50, 80)
    doc.fontSize(10).fillColor('#64748b').text(`Generated: ${new Date().toLocaleDateString()}`, 50, 95)
    doc.moveDown(2)

    // Summary
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    doc.fontSize(14).fillColor('#e2e8f0').text('Summary', 50, doc.y)
    doc.fontSize(11).fillColor('#94a3b8').text(`Total Expenses: ₹${total.toFixed(2)}`)
    doc.text(`Total Transactions: ${expenses.length}`)
    doc.moveDown()

    // Table header
    doc.fontSize(12).fillColor('#22c55e').text('Transactions', 50, doc.y)
    doc.moveDown(0.5)

    const cols = [50, 200, 300, 380, 460]
    doc.fontSize(9).fillColor('#64748b')
    doc.text('Title', cols[0], doc.y, { width: 140 })
    doc.text('Category', cols[1], doc.y - doc.currentLineHeight(), { width: 90 })
    doc.text('Amount', cols[2], doc.y - doc.currentLineHeight(), { width: 70 })
    doc.text('Date', cols[3], doc.y - doc.currentLineHeight(), { width: 80 })
    doc.moveDown(0.3)

    doc.strokeColor('#1e2535').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.3)

    expenses.slice(0, 50).forEach(e => {
      if (doc.y > 700) { doc.addPage(); }
      doc.fontSize(9).fillColor('#e2e8f0')
      const y = doc.y
      doc.text(e.title.substring(0, 25), cols[0], y, { width: 140 })
      doc.text(e.category, cols[1], y, { width: 90 })
      doc.text(`₹${e.amount.toFixed(2)}`, cols[2], y, { width: 70 })
      doc.text(new Date(e.date).toLocaleDateString(), cols[3], y, { width: 80 })
      doc.moveDown(0.4)
    })

    doc.end()
  } catch (err) {
    res.status(500).json({ message: 'Export failed', error: err.message })
  }
})

// GET /api/export/excel
router.get('/excel', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 })
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'FinTrack Pro'

    // Transactions sheet
    const sheet = workbook.addWorksheet('Transactions')
    sheet.columns = [
      { header: 'Title',    key: 'title',    width: 30 },
      { header: 'Amount',   key: 'amount',   width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Date',     key: 'date',     width: 15 },
      { header: 'Notes',    key: 'notes',    width: 30 },
    ]

    // Style header
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FF22C55E' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1117' } }
    })

    expenses.forEach(e => {
      sheet.addRow({ title: e.title, amount: e.amount, category: e.category, date: new Date(e.date).toLocaleDateString(), notes: e.notes })
    })

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    summarySheet.addRow(['Metric', 'Value'])
    summarySheet.addRow(['Total Expenses', `₹${total.toFixed(2)}`])
    summarySheet.addRow(['Total Transactions', expenses.length])

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=fintrack-export.xlsx')
    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    res.status(500).json({ message: 'Export failed', error: err.message })
  }
})

module.exports = router
