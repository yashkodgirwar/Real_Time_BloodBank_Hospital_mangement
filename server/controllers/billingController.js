const Razorpay = require('razorpay');
const orders = require('../models/Order');
const User = require('../models/User');
const bills = require('../models/Bill');
const sendEmail = require('../mailer');
const { jsPDF } = require("jspdf");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1. Generate Bill
const generateBill = async (req, res) => {
  try {
    const { hospitalName, amount } = req.body;

    if (!hospitalName || !amount) {
      return res.status(400).json({ message: "Hospital name and amount are required" });
    }

    const newBill = new bills({
      hospitalName,
      amount,
      date: new Date()
    });

    await newBill.save();
    res.status(201).json({ message: "Bill generated successfully!", bill: newBill });

  } catch (error) {
    console.error("Error saving bill:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Fetch General Bills with Filters (Hospital Name, Month, Day)
const getBilling = async (req, res) => {
  try {
    const { hospitalName, month, day } = req.query;
    let filter = {};

    if (hospitalName) {
      filter.hospitalName = hospitalName;
    }

    if (month) {
      const start = new Date(new Date().getFullYear(), month - 1, 1);
      const end = new Date(new Date().getFullYear(), month, 0);
      filter.date = { $gte: start, $lte: end };
    }

    if (day) {
      const start = new Date(day);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const results = await bills.find(filter);
    res.json(results);
  } catch (error) {
    console.error("Error fetching billing data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Fetch Unique Hospital Names for Filtering
const getHospitalNames = async (req, res) => {
  try {
    const hospitals = await bills.distinct("hospitalName");
    res.json(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Fetch Hospital Billing (Hospital user viewing their bill grouped by bank)
const getHospitalBilling = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.type !== "hospital") {
      return res.status(403).json({ message: "Access denied" });
    }

    const hospitalEmail = req.session.user.email;
    const { month, date, bankId, paymentStatus } = req.query;

    let filter = {
      hospitalEmail: hospitalEmail,
      status: 'Approved'
    };

    if (paymentStatus) {
      if (paymentStatus === 'All') {
        delete filter.paymentStatus;
      } else {
        if (paymentStatus === 'Unpaid') {
          filter.$or = [{ paymentStatus: 'Unpaid' }, { paymentStatus: { $exists: false } }];
        } else {
          filter.paymentStatus = paymentStatus;
        }
      }
    } else {
      filter.$or = [{ paymentStatus: 'Unpaid' }, { paymentStatus: { $exists: false } }];
    }

    if (bankId) {
      filter.bankId = bankId;
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (month) {
      const [yyyy, mm] = month.split('-');
      const start = new Date(yyyy, mm - 1, 1);
      const end = new Date(yyyy, mm, 0);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const results = await orders.find(filter).lean();

    const groupedData = {};
    for (let order of results) {
      if (!groupedData[order.bankId]) {
        try {
          const bank = await User.findById(order.bankId);
          groupedData[order.bankId] = {
            bankId: order.bankId,
            bankName: bank ? bank.name : 'Unknown Bank',
            totalPending: 0,
            orders: [],
            daywise: {}
          };
        } catch (e) {
          groupedData[order.bankId] = {
            bankId: order.bankId,
            bankName: 'Unknown Bank',
            totalPending: 0,
            orders: [],
            daywise: {}
          };
        }
      }

      const amount = (order.units || 0) * 10;
      groupedData[order.bankId].totalPending += amount;
      groupedData[order.bankId].orders.push({ ...order, amount });

      const dayString = new Date(order.date).toLocaleDateString();
      if (!groupedData[order.bankId].daywise[dayString]) {
        groupedData[order.bankId].daywise[dayString] = 0;
      }
      groupedData[order.bankId].daywise[dayString] += amount;
    }

    res.json(Object.values(groupedData));
  } catch (error) {
    console.error("Error fetching hospital billing data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 5. Fetch Blood Bank Billing (Bloodbank user viewing pending hospital bills)
const getBloodbankPendingBills = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.type !== "bloodbank") {
      return res.status(403).json({ message: "Access denied" });
    }

    const bankEmail = req.session.user.email;
    const bloodBank = await User.findOne({ email: bankEmail });
    if (!bloodBank) return res.status(404).json({ message: "Bank not found" });

    const { hospitalEmail, month, date, paymentStatus } = req.query;

    let filter = {
      bankId: String(bloodBank._id),
      status: 'Approved'
    };
    
    if (paymentStatus && paymentStatus !== 'All') {
      if (paymentStatus === 'Unpaid') {
        filter.$or = [{ paymentStatus: 'Unpaid' }, { paymentStatus: { $exists: false } }];
      } else {
        filter.paymentStatus = paymentStatus;
      }
    }

    console.log("Payment Status:", paymentStatus);
    console.log("Final Filter:", filter);

    if (hospitalEmail) filter.hospitalEmail = hospitalEmail;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (month) {
      const [yearStr, monthStr] = month.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);

      filter.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const unpaidOrders = await orders.find(filter).sort({ date: 1 });

    const groupedData = {};
    unpaidOrders.forEach(order => {
      const amount = order.units * 10;

      if (!groupedData[order.hospitalEmail]) {
        groupedData[order.hospitalEmail] = {
          hospitalName: order.hospitalName,
          hospitalEmail: order.hospitalEmail,
          totalPending: 0,
          orders: [],
          daywise: {}
        };
      }

      groupedData[order.hospitalEmail].totalPending += amount;
      groupedData[order.hospitalEmail].orders.push({ ...order._doc, amount });

      const dayString = new Date(order.date).toLocaleDateString();
      if (!groupedData[order.hospitalEmail].daywise[dayString]) {
        groupedData[order.hospitalEmail].daywise[dayString] = 0;
      }
      groupedData[order.hospitalEmail].daywise[dayString] += amount;
    });

    res.json(Object.values(groupedData));
  } catch (error) {
    console.error("Error fetching bank billing data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 6. Get Razorpay Config Key ID
const getRazorpayConfig = (req, res) => {
  res.json({ key_id: process.env.RAZORPAY_KEY_ID });
};

// 7. Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

// 8. Process Payment (Pay Bill)
const payBill = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.type !== "hospital") {
      return res.status(403).json({ message: "Access denied" });
    }

    const hospitalEmail = req.session.user.email;
    const { bankId, payAll, razorpay_payment_id } = req.body;

    let filter = {
      hospitalEmail: hospitalEmail,
      status: 'Approved',
      paymentStatus: 'Unpaid'
    };

    if (!payAll && bankId) {
      filter.bankId = bankId;
    }

    const unpaidOrders = await orders.find(filter);
    if (unpaidOrders.length === 0) {
      return res.status(400).json({ message: "No unpaid orders found" });
    }

    let totalPaid = 0;
    const banksPaid = new Set();
    unpaidOrders.forEach(o => {
      totalPaid += (o.units * 10);
      banksPaid.add(o.bankId);
    });

    await orders.updateMany(filter, { $set: { paymentStatus: 'Paid', paymentId: razorpay_payment_id || 'Manual' } });

    // Send Emails
    try {
      const hospitalUser = await User.findOne({ email: hospitalEmail });
      const dateStr = new Date().toLocaleString();

      for (const bId of banksPaid) {
        const bankUser = await User.findById(bId);
        if (bankUser && hospitalUser) {
          const bankOrders = unpaidOrders.filter(o => String(o.bankId) === String(bId));
          let bankTotal = 0;
          bankOrders.forEach(o => {
            bankTotal += ((o.units || 0) * 10);
          });

          // Generate PDF Receipt
          const doc = new jsPDF();

          // Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(229, 62, 62); // Red accent (#e53e3e)
          doc.text("BloodLink Payment Receipt", 14, 20);

          // Line separator
          doc.setDrawColor(200, 200, 200);
          doc.line(14, 25, 196, 25);

          // Metadata
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(`Transaction ID: ${razorpay_payment_id || 'Cash/Manual'}`, 14, 33);
          doc.text(`Payment Date: ${dateStr}`, 14, 39);

          // Box for details
          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(248, 249, 250);
          doc.rect(14, 45, 182, 38, "FD");

          doc.setFont("helvetica", "bold");
          doc.setTextColor(50, 50, 50);
          doc.text("Payer (Hospital):", 18, 52);
          doc.setFont("helvetica", "normal");
          doc.text(`${hospitalUser.name} (${hospitalUser.email})`, 55, 52);

          doc.setFont("helvetica", "bold");
          doc.text("Payee (Blood Bank):", 18, 60);
          doc.setFont("helvetica", "normal");
          doc.text(`${bankUser.name} (${bankUser.email})`, 55, 60);

          doc.setFont("helvetica", "bold");
          doc.text("Total Amount Paid:", 18, 68);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(229, 62, 62);
          doc.text(`${bankTotal} INR`, 55, 68);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);

          // Table Header
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(14, 90, 182, 8, "FD");
          doc.text("Patient Name", 18, 95);
          doc.text("Blood Group", 65, 95);
          doc.text("Order Date", 105, 95);
          doc.text("Units", 145, 95);
          doc.text("Amount", 170, 95);

          // Table Rows
          doc.setFont("helvetica", "normal");
          let y = 105;
          for (const order of bankOrders) {
            if (y > 270) {
              doc.addPage();
              y = 20;
              // Reprint header on new page
              doc.setFont("helvetica", "bold");
              doc.setFillColor(240, 240, 240);
              doc.rect(14, y - 5, 182, 8, "FD");
              doc.text("Patient Name", 18, y);
              doc.text("Blood Group", 65, y);
              doc.text("Order Date", 105, y);
              doc.text("Units", 145, y);
              doc.text("Amount", 170, y);
              doc.setFont("helvetica", "normal");
              y += 12;
            }

            const pName = order.patientName || 'N/A';
            const bGroup = order.bloodGroup || 'N/A';
            const oDate = order.date ? new Date(order.date).toLocaleDateString() : 'N/A';
            const units = order.units || 0;
            const amt = units * 10;

            doc.text(pName, 18, y);
            doc.text(bGroup, 65, y);
            doc.text(oDate, 105, y);
            doc.text(String(units), 145, y);
            doc.text(`${amt} INR`, 170, y);
            y += 8;
          }

          const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
          const attachments = [{
            filename: `receipt_${bankUser.name.replace(/\s+/g, '_')}_${razorpay_payment_id || 'manual'}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }];

          const receiptHtml = `
             <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
               <h3 style="color: #e53e3e; margin-top: 0;">Payment Receipt</h3>
               <p><strong>Transaction ID:</strong> ${razorpay_payment_id || 'Cash/Manual'}</p>
               <p><strong>Date:</strong> ${dateStr}</p>
               <p><strong>Payer (Hospital):</strong> ${hospitalUser.name} (${hospitalUser.email})</p>
               <p><strong>Payee (Blood Bank):</strong> ${bankUser.name} (${bankUser.email})</p>
               <p><strong>Amount Paid to this Bank:</strong> ${bankTotal} INR</p>
               <p><strong>Status:</strong> Successful</p>
               <p>Please find the PDF receipt attached to this email.</p>
             </div>
           `;

          sendEmail(hospitalUser.email, "Blood Bank Payment Receipt", receiptHtml, attachments).catch(emailErr => {
            console.error("Error sending receipt email to hospital:", emailErr);
          });
          sendEmail(bankUser.email, "Blood Bank Payment Received", receiptHtml, attachments).catch(emailErr => {
            console.error("Error sending receipt email to bank:", emailErr);
          });
        }
      }
    } catch (emailErr) {
      console.error("Error sending receipt emails:", emailErr);
    }

    res.json({ message: "Payment processed successfully" });

  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 9. Fetch Order History (Hospital view)
const getHistory = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const hospitalName = req.session.user.name;
    const entries = await orders.find({ hospitalName }).lean().sort({ date: -1 });

    for (let entry of entries) {
      if (entry.bankId) {
        try {
          const bank = await User.findById(entry.bankId);
          entry.bankName = bank ? bank.name : 'Unknown';
        } catch (e) {
          entry.bankName = 'Unknown';
        }
      } else {
        entry.bankName = 'N/A';
      }
      entry.amount = (entry.units || 0) * 10;
    }

    res.json(entries);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ message: "Error fetching history" });
  }
};

module.exports = {
  generateBill,
  getBilling,
  getHospitalNames,
  getHospitalBilling,
  getBloodbankPendingBills,
  getRazorpayConfig,
  createRazorpayOrder,
  payBill,
  getHistory
};
