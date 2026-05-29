const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const User = require('../models/User');
const sendEmail = require('../mailer');

// 1. Register User (Hospital / Blood Bank)
const registerUser = async (req, res) => {
  try {
    const { type, name, email, password, address, licenseNumber, bankAccountNumber, bankIFSCCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const exstinglicense = await User.findOne({ licenseNumber });
    if (exstinglicense) {
      return res.status(400).json({ message: 'LicenseNumber already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let uploadedLicenses = [];
    if (req.files && req.files.length > 0) {
      uploadedLicenses = req.files.map(file => file.path);
    }

    const newUser = new User({
      type,
      name,
      email,
      password: hashedPassword,
      address,
      licenseNumber,
      bankAccountNumber,
      bankIFSCCode,
      status: 'under review',
      licenses: uploadedLicenses
    });

    await newUser.save();

    // Send welcome email with a premium template
    try {
      await sendEmail(
        newUser.email,
        `🩸 Welcome to BloodLink - Registration Under Review`,
        `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; text-align: center;">
          <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 35px 20px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 10px; border-radius: 50%; margin-bottom: 12px;">
                <span style="font-size: 30px; line-height: 1;">🩸</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome to BloodLink</h1>
            </div>
            
            <!-- Content Body -->
            <div style="padding: 35px; text-align: left; color: #374151; line-height: 1.6;">
              <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">Hello ${name},</h2>
              <p style="font-size: 15px; margin-bottom: 20px;">Thank you for registering your <strong>${type === 'hospital' ? 'Hospital' : 'Blood Bank'}</strong> on BloodLink. We are excited to have you join our life-saving network!</p>
              
              <!-- Registration Details -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #e11d48;">
                <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Account Details</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; width: 120px; font-weight: 500;">Entity Name:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-weight: 600;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-weight: 500;">Email:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-weight: 600;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-weight: 500;">Type:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-weight: 600; text-transform: capitalize;">${type === 'bloodbank' ? 'Blood Bank' : 'Hospital'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-weight: 500;">License No:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-weight: 600;">${licenseNumber}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 15px; margin-bottom: 20px;">Your registration documents are currently <strong>under review</strong> by our administration team. Once approved, you will have full access to order blood, update inventories, and manage campaign suggestions.</p>
              
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="http://localhost:5173/login" style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 15px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.3); display: inline-block;">Go to Login</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 5px 0;">This is an automated welcome email. Please do not reply directly.</p>
              <p style="margin: 0;">© 2026 BloodLink. Connecting lives, saving futures.</p>
            </div>
          </div>
        </div>
        `
      );
    } catch (mailError) {
      console.error("Failed to send welcome email:", mailError);
    }

    res.status(201).json({ message: 'Registration successful! Your account is under review.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Login User
const loginUser = async (req, res) => {
  const { email, password, type } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.type !== type) {
      return res.status(403).json({ message: `Access denied for ${type} login.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      type: user.type,
      address: user.address,
      licenseNumber: user.licenseNumber
    };
    res.status(200).json({ message: 'Login successful', user });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Logout User
const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

// 4. Check Current User Session Profile
const checkProfile = (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
};

// 5. Send Password Reset Email Link
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await sendEmail(
      user.email,
      "BloodLink Password Reset",
      `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 1 hour.</p>
      `
    );

    res.json({ message: "Password reset link sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 6. Serves frontend layout fallback for reset-password view
const serveResetPasswordView = (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
};

// 7. Process Password Reset Token Submit
const resetPassword = async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      return res.send("Invalid or expired token");
    }

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    req.session.destroy(() => {
      if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
        return res.json({ message: "Password reset successfully!" });
      }
      res.redirect('/?show=login');
    });

  } catch (err) {
    console.error(err);
    if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ message: "Server error" });
    }
    res.send("Server error");
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  checkProfile,
  forgotPassword,
  serveResetPasswordView,
  resetPassword
};
