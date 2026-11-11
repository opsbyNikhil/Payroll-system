const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const prisma = require("../utils/prisma");

const generatePayslip = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: {
        id: Number(payrollId),
      },
      include: {
        employee: true,
        company: true,
        items: true,
      },
    });

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll not found",
      });
    }

    const payslipDir = path.join(__dirname, "../../payslips");

    if (!fs.existsSync(payslipDir)) {
      fs.mkdirSync(payslipDir, {
        recursive: true,
      });
    }

    const employeeCode =
      payroll.employee?.employeeCode || `EMP${payroll.employee?.id}`;

    const now = new Date();

    const timestamp =
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_` +
      `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

    const fileName = `PAYSLIP_${employeeCode}_${payroll.payrollYear}_${String(payroll.payrollMonth).padStart(2, "0")}_${timestamp}.pdf`;

    const filePath = path.join(payslipDir, fileName);

    // --------------------------------------------------
    // FONT
    // --------------------------------------------------

    const fontPath = path.join(__dirname, "../../fonts/NotoSans-Regular.ttf");

    if (!fs.existsSync(fontPath)) {
      return res.status(500).json({
        message: "NotoSans-Regular.ttf font not found in backend/fonts",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // --------------------------------------------------
    // COLORS
    // --------------------------------------------------

    const primaryColor = "#2563EB";
    const secondaryColor = "#0EA5E9";
    const earningsColor = "#16A34A";
    const deductionColor = "#EA580C";
    const lightGray = "#F3F4F6";
    const borderColor = "#D1D5DB";
    const darkColor = "#111827";
    const mutedColor = "#6B7280";
    const white = "#FFFFFF";

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    doc.roundedRect(40, 40, 515, 90, 10).fill(primaryColor);

    doc
      .fillColor(white)
      .font(fontPath)
      .fontSize(24)
      .text(payroll.company?.name || "MAGNEQ TECHNOLOGIES", 60, 60);

    doc
      .fontSize(10)
      .font(fontPath)
      .text(payroll.company?.address || "Hyderabad, Telangana", 60, 92);

    doc.text(payroll.company?.email || "admin@magneq.com", 60, 108);

    doc.fontSize(16).font(fontPath).text("SALARY SLIP", 400, 72, {
      width: 130,
      align: "right",
    });

    // --------------------------------------------------
    // PAY PERIOD
    // --------------------------------------------------

    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font(fontPath)
      .text(
        `Pay Period: ${payroll.payrollMonth}/${payroll.payrollYear}`,
        40,
        150,
      );

    doc
      .font(fontPath)
      .fillColor(mutedColor)
      .text(
        `Payslip ID: PS-${payroll.id.toString().padStart(5, "0")}`,
        400,
        150,
        {
          width: 155,
          align: "right",
        },
      );

    // --------------------------------------------------
    // EMPLOYEE INFORMATION
    // --------------------------------------------------

    doc.roundedRect(40, 180, 515, 105, 8).fill(lightGray);

    doc
      .fillColor(darkColor)
      .fontSize(12)
      .font(fontPath)
      .text("Employee Information", 55, 195);

    const employeeName = `${payroll.employee?.firstName || ""} ${
      payroll.employee?.lastName || ""
    }`.trim();

    doc
      .fontSize(10)
      .font(fontPath)
      .fillColor(darkColor)
      .text("Employee Name", 55, 225);

    doc.font(fontPath).text(employeeName || "N/A", 170, 225);

    doc.font(fontPath).text("Employee Code", 55, 248);

    doc.font(fontPath).text(payroll.employee?.employeeCode || "N/A", 170, 248);

    doc.font(fontPath).text("Payment Status", 320, 225);

    doc
      .font(fontPath)
      .fillColor(earningsColor)
      .text(payroll.status || "N/A", 420, 225);

    doc.fillColor(darkColor).font(fontPath).text("Generated Date", 320, 248);

    doc.font(fontPath).text(new Date().toLocaleDateString("en-IN"), 420, 248);

    // --------------------------------------------------
    // SALARY TABLE HEADER
    // --------------------------------------------------

    let y = 315;

    doc.roundedRect(40, y, 515, 32, 6).fill(secondaryColor);

    doc
      .fillColor(white)
      .fontSize(11)
      .font(fontPath)
      .text("SALARY COMPONENT", 55, y + 10);

    doc.text("TYPE", 350, y + 10);

    doc.text("AMOUNT", 455, y + 10, {
      width: 85,
      align: "right",
    });

    y += 32;

    // --------------------------------------------------
    // SALARY ITEMS
    // --------------------------------------------------
    console.log("Salary items:", payroll.items.length);
    payroll.items.forEach((item, index) => {
      const isDeduction = item.type === "DEDUCTION";

      if (index % 2 === 0) {
        doc.rect(40, y, 515, 24).fill("#F9FAFB");
      }

      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font(fontPath)
        .text(item.name, 55, y + 7);

      doc
        .fillColor(isDeduction ? deductionColor : earningsColor)
        .font(fontPath)
        .text(isDeduction ? "DEDUCTION" : "EARNING", 350, y + 7);

      doc
        .fillColor(darkColor)
        .font(fontPath)
        .text(`₹${Number(item.amount).toLocaleString("en-IN")}`, 455, y + 7, {
          width: 85,
          align: "right",
        });

      y += 24;
    });

    // --------------------------------------------------
    // SUMMARY
    // --------------------------------------------------

    y += 5;

    doc.roundedRect(40, y, 515, 110, 8).fill(lightGray);

    doc
      .fillColor(darkColor)
      .fontSize(11)
      .font(fontPath)
      .text("PAYROLL SUMMARY", 55, y + 15);

    doc.font(fontPath).text("Gross Salary", 55, y + 42);

    doc.text(
      `₹${Number(payroll.grossSalary).toLocaleString("en-IN")}`,
      430,
      y + 42,
      {
        width: 105,
        align: "right",
      },
    );

    doc
      .fillColor(deductionColor)
      .font(fontPath)
      .text("Total Deductions", 55, y + 64);

    doc.text(
      `₹${Number(payroll.totalDeductions).toLocaleString("en-IN")}`,
      430,
      y + 64,
      {
        width: 105,
        align: "right",
      },
    );

    // --------------------------------------------------
    // NET SALARY
    // --------------------------------------------------

    doc.roundedRect(40, y + 105, 515, 65, 8).fill(primaryColor);

    doc
      .fillColor(white)
      .fontSize(13)
      .font(fontPath)
      .text("NET SALARY", 60, y + 125);

    doc
      .fontSize(22)
      .font(fontPath)
      .text(
        `₹${Number(payroll.netSalary).toLocaleString("en-IN")}`,
        350,
        y + 120,
        {
          width: 180,
          align: "right",
        },
      );

    // --------------------------------------------------
    // FOOTER
    // --------------------------------------------------
    console.log("Final y before footer:", y);
    const footerY = y + 175;

    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font(fontPath)
      .text("Amount in Words", 40, footerY);

    doc
      .font(fontPath)
      .fillColor(mutedColor)
      .text(
        `Rupees ${numberToWords(Number(payroll.netSalary))} Only`,
        40,
        footerY + 18,
        {
          width: 515,
        },
      );

    doc
      .moveTo(40, footerY + 55)
      .lineTo(555, footerY + 55)
      .strokeColor(borderColor)
      .stroke();

    doc
      .fontSize(9)
      .font(fontPath)
      .fillColor(mutedColor)
      .text(
        "This is a computer-generated payslip and does not require a signature.",
        40,
        footerY + 70,
        {
          width: 515,
          align: "center",
        },
      );

    doc.end();

    stream.on("finish", async () => {
      try {
        const payslip = await prisma.payslip.upsert({
          where: {
            payrollId: payroll.id,
          },
          update: {
            pdfPath: filePath,
          },
          create: {
            payrollId: payroll.id,
            pdfPath: filePath,
          },
        });

        await prisma.payslipHistory.create({
          data: {
            payslipId: payslip.id,
            pdfPath: filePath,
          },
        });

        res.status(201).json({
          message: "Payslip generated successfully",
          payslip,
        });
      } catch (error) {
        console.error(error);

        res.status(500).json({
          message: "Payslip generated but database record failed",
        });
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to generate payslip",
    });
  }
};

// --------------------------------------------------
// NUMBER TO WORDS
// --------------------------------------------------

const numberToWords = (number) => {
  if (number === 0) {
    return "Zero";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertLessThanThousand = (
    num
  ) => {
    let result = "";

    if (num >= 100) {
      result += `${
        ones[Math.floor(num / 100)]
      } Hundred `;

      num %= 100;
    }

    if (num >= 20) {
      result += `${
        tens[Math.floor(num / 10)]
      } `;

      num %= 10;
    }

    if (num > 0) {
      result += `${ones[num]} `;
    }

    return result.trim();
  };

  let result = "";

  const lakhs = Math.floor(
    number / 100000
  );

  number %= 100000;

  const thousands = Math.floor(
    number / 1000
  );

  number %= 1000;

  if (lakhs > 0) {
    result += `${convertLessThanThousand(
      lakhs
    )} Lakh `;
  }

  if (thousands > 0) {
    result += `${convertLessThanThousand(
      thousands
    )} Thousand `;
  }

  if (number > 0) {
    result += `${convertLessThanThousand(
      number
    )}`;
  }

  return result.trim();
};

const checkPayslip = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payslip = await prisma.payslip.findUnique({
      where: {
        payrollId: Number(payrollId),
      },
    });

    if (!payslip) {
      return res.json({
        exists: false,
      });
    }

    return res.json({
      exists: true,
      payslip: {
        id: payslip.id,
        pdfPath: payslip.pdfPath,
      },
    });
  } catch (error) {
    console.error("Failed to check payslip:", error);

    return res.status(500).json({
      message: "Failed to check payslip",
    });
  }
};

const getPayslipHistory = async (req, res) => {
  try {
    const history = await prisma.payslipHistory.findMany({
      orderBy: {
        generatedAt: "desc",
      },
      include: {
        payslip: {
          include: {
            payroll: {
              include: {
                employee: true,
              },
            },
          },
        },
      },
    });

    
    const payslips = history.map((item) => ({
      id: item.id,
      payrollId: item.payslip.payroll.id,
      employeeCode: item.payslip.payroll.employee.employeeCode,
      employeeName:
        `${item.payslip.payroll.employee.firstName} ${item.payslip.payroll.employee.lastName || ""}`.trim(),
      payrollMonth: item.payslip.payroll.payrollMonth,
      payrollYear: item.payslip.payroll.payrollYear,
      pdfPath: item.pdfPath,
      generatedAt: item.generatedAt,
    }));

    res.json(payslips);
  } catch (error) {
    console.error("Failed to fetch payslip history:", error);

    res.status(500).json({
      message: "Failed to fetch payslip history",
    });
  }
};

const viewPayslipPdf = async (req, res) => {
  try {
    const { historyId } = req.params;

    const history = await prisma.payslipHistory.findUnique({
      where: {
        id: Number(historyId),
      },
    });

    if (!history) {
      return res.status(404).json({
        message: "Payslip history not found",
      });
    }

    if (!fs.existsSync(history.pdfPath)) {
      return res.status(404).json({
        message: "Payslip PDF file not found",
      });
    }

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(history.pdfPath)}"`,
    );

    res.sendFile(path.resolve(history.pdfPath));
  } catch (error) {
    console.error("Failed to view payslip PDF:", error);

    res.status(500).json({
      message: "Failed to view payslip PDF",
    });
  }
};


module.exports = {
  generatePayslip,
  checkPayslip,
  getPayslipHistory,
  viewPayslipPdf,
};
